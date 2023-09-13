import React, {useRef} from 'react';
import './App.css';
import default_pic from "./Asset/robot-assistant.png"
import {useEffect, useState} from "react";
import axios from 'axios';

function isPc() {
    if (window.navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
        return true; // 移动端
    } else {
        return false; // PC端
    }
}

const controlView = isPc();

function App() {
    //状态管理
    //stage: home 0, record 1, process 2, display 3
    const [stage, setStage] = useState(0)

    //视频录制
    const videoRef = useRef(null);
    const mediaRecorder = useRef(null);
    const mediaChunks = useRef([]);
    const [recording, setRecording] = useState(false);

    //录制计时器
    const timerRef = useRef(null);
    const [recordTime, setRecordTime] = useState(0);
    const [pauseTime, setPauseTime] = useState(false);

    //回传音频播放
    const [audioSrc, setAudioSrc] = useState('');
    const audioRef = React.createRef();

    //回传GIF播放
    const [sentiment, setSentiment] = useState('neural');

    //录制视频下载
    //const downloadLinkRef = useRef(null);
    //const [videoBlob, setVideoBlob] = useState(null);

    //录制视频下载函数
    // const downloadVideo = () => {
    //     console.log("videoBlob",videoBlob)
    //     if (videoBlob) {
    //         const url = window.URL.createObjectURL(videoBlob);
    //         const a = document.createElement('a');
    //         a.href = url;
    //         a.download = 'recorded-video.mp4';
    //         a.style.display = 'none';
    //         document.body.appendChild(a);
    //         a.click();
    //     }
    // };

    //播放音频
    const playAudio = () => {
        if (audioSrc) {
            audioRef.current.play();
        }
    };

    //重新播放音频
    const replayAudio = () => {
        if (audioSrc) {
            audioRef.current.currentTime = 0; // 将播放时间重置为0秒
            audioRef.current.play();
        }
    };

    //开始录制
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
            videoRef.current.srcObject = stream;
            mediaRecorder.current = new MediaRecorder(stream);

            //有数据传输的时候进行记录
            mediaRecorder.current.ondataavailable = (event) => {
                // 记录event数据
                console.log("event", event)
                if (event.data.size > 0) {
                    mediaChunks.current.push(event.data);
                    console.log("dataflow", event.data)
                }
            };

            //点击发送后触发onstop函数
            mediaRecorder.current.onstop = () => {
                const blob = new Blob(mediaChunks.current, {type: 'video/mp4'});

                //下载录制好的视频
                //setVideoBlob(blob);

                //创建FormData对象
                const formData = new FormData();
                formData.append('file', blob);
                formData.append('agent', 'test_agent');
                formData.append('task', 'test_task');

                // 使用Axios发送POST请求
                axios.post('https://fqcrjdj2iw.ap-northeast-1.awsapprunner.com/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Basic ${btoa('yj:95149d8a61e9')}`,
                    },
                })
                    .then((response) => {
                        //返回数据后进行读取
                        const base64AudioData = response?.data?.audio;
                        setAudioSrc(base64AudioData);
                        //todo：重播GIF功能
                    })
                    .catch((error) => {
                        console.error('上传视频时出错:', error);
                    });

                //重置录制状态和计时器
                setRecording(false);
                mediaChunks.current = [];
                clearInterval(timerRef.current);
                setRecordTime(0);

                //切换成播放场景
                setStage(3);

                //播放音频
                playAudio();
            };

            //启动录制
            mediaRecorder.current.start();
            setRecording(true);

            //启动计时器
            timerRef.current = setInterval(() => {
                setRecordTime((prevTime) => prevTime + 1);
            }, 1000);

        } catch (error) {
            console.error('获取用户媒体设备时出错:', error);
        }
    };

    //点击发布进行发送
    const postRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop()
            clearInterval(timerRef.current);
            setRecording(false);
            setRecordTime(0)
        }
    };

    //取消录制
    const cancelRecording = () => {
        mediaChunks.current = [];
        clearInterval(timerRef.current);
        setRecording(false);
        setRecordTime(0)
    }

    //暂停计时器
    const pauseTiming = () => {
        clearInterval(timerRef.current);
    };

    //恢复计时器
    const resumeTiming = () => {
        timerRef.current = setInterval(() => {
            setRecordTime((prevTime) => prevTime + 1);
        }, 1000);
    };

    //页面html
    return (
        <div className="container">
            {
                controlView ?
                    <div>

                        {/*stage0: home page*/}
                        {stage === 0 ?
                            <div>
                                <div className="pic-box">
                                    <img src={default_pic} className="pic"/>
                                </div>
                                <div className="button-box">
                                    <button className="enter-button" onClick={() => {
                                        setStage(1);
                                        startRecording()
                                    }} disabled={recording}>
                                        点击开始录制
                                    </button>
                                </div>
                            </div> : null}

                        {/*stage1: record page*/}
                        {stage === 1 ?
                            <div>
                                <div className="pic-box">
                                    <img src={default_pic} className="pic"/>
                                    <video ref={videoRef} muted autoPlay playsInline
                                           style={{marginTop: 50, width: "0%", borderRadius: "3em"}}/>
                                    <p className="text" style={{
                                        justifyContent: "center",
                                        display: 'flex'
                                    }}>{!pauseTime ? "正在录制..." : "已暂停"}</p>
                                </div>
                                <div className="button-box"
                                     style={{flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 50}}>
                                    <button className="cancel-button" onClick={() => {
                                        setStage(0);
                                        cancelRecording()
                                    }}>
                                        取消
                                    </button>
                                    {/*<button onClick={downloadVideo}>下载录制的视频</button>*/}
                                    <button className="send-button" onClick={() => {
                                        setStage(2);
                                        postRecording();
                                    }} disabled={!recording}>
                                        发送
                                    </button>
                                    {
                                        pauseTime ?
                                            <button className="stop-button" onClick={() => {
                                                setPauseTime(false);
                                                resumeTiming()
                                            }}>
                                                继续
                                            </button> :
                                            <button className="stop-button" onClick={() => {
                                                setPauseTime(true);
                                                pauseTiming()
                                            }}>
                                                暂停
                                            </button>
                                    }
                                </div>
                            </div> : null}

                        {/*stage2: process page*/}
                        {stage === 2 ?
                            <div>
                                <div className="pic-box">
                                    <img src={default_pic} className="pic"/>
                                    <p className="text"
                                       style={{justifyContent: "center", display: 'flex'}}>正在处理...</p>
                                </div>
                                <div className="button-box">

                                </div>
                            </div> : null}

                        {/*stage3: display page*/}
                        {stage === 3 ?
                            <div>
                                <div className="pic-box">
                                    <img src={default_pic} className="pic"/>
                                    <audio ref={audioRef} controls
                                           style={{marginTop: 50, width: "100%", borderRadius: "3em"}}>
                                        <source src={audioSrc} type="audio/mpeg"/>
                                        您的浏览器不支持音频标签。
                                    </audio>
                                </div>
                                <div className="button-box" style={{
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    gap: 12,
                                    marginTop: "0vh"
                                }}>

                                    <button className="replay-button" onClick={replayAudio}>
                                        重播
                                    </button>
                                    <button className="create-button" onClick={() => {
                                        setPauseTime(false);
                                        setStage(1);
                                        startRecording();
                                    }}>
                                        创建新的对话
                                    </button>
                                    <button className="continue-button" onClick={() => {
                                        setPauseTime(false);
                                        setStage(1);
                                        startRecording()
                                    }}>
                                        继续此对话
                                    </button>
                                </div>
                            </div> : null}
                    </div>
                    :
                    <div>
                        web
                    </div>
            }
        </div>
    );
}

export default App;
