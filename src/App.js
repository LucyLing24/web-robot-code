
import React, { useRef } from 'react';
import './App.css';
import default_pic from "./Asset/robot-assistant.png"
import {useEffect,  useState} from "react";
import axios from 'axios';

function isPc(){
    if(window.navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
        return true; // 移动端
    }else{
        return false; // PC端
    }
}
const controlView=isPc();

function App() {
    // stage: home 0, record 1, process 2, display 3
    const [stage,setStage]=useState(0)
    const [send,setSend]=useState(false)

    //视频录制
    const videoRef = useRef(null);
    const mediaRecorder = useRef(null);
    const mediaChunks = useRef([]);
    const [recording, setRecording] = useState(false);

    //录制计时器
    const timerRef = useRef(null);
    const [recordTime, setRecordTime] = useState(0);
    const [pauseTime,setPauseTime]= useState(false);

    //回传音频播放
    const [audioSrc, setAudioSrc] = useState(''); // 存储音频文件的 base64 数据
    const audioRef = React.createRef(); // 创建一个对 <audio> 元素的引用

    //回传GIF播放
    const [sentiment,setSentiment] =useState('neural');

    const playAudio = () => {
        if (audioSrc) {
            audioRef.current.play(); // 播放音频
        }
    };

    const replayAudio = () => {
        if (audioSrc) {
            audioRef.current.currentTime = 0; // 将播放时间重置为0秒
            audioRef.current.play(); // 重新播放音频
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true ,audio:true});
            videoRef.current.srcObject = stream;
            mediaRecorder.current = new MediaRecorder(stream);

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    mediaChunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(mediaChunks.current, { type: 'video/mp4' });

                // 创建 FormData 对象
                const formData = new FormData();
                formData.append('file', blob, 'recorded-video.mp4');
                formData.append('agent', 'test_agent');
                formData.append('task', 'test_task');

                // 使用 Axios 发送 POST 请求
                axios.post('https://fqcrjdj2iw.ap-northeast-1.awsapprunner.com/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data', // 设置请求头
                        'Authorization': `Basic test_user:95149d8a61e9`,
                    },
                })
                    .then((response) => {
                        const base64AudioData = response?.data?.audio;
                        setAudioSrc(base64AudioData);
                    })
                    .catch((error) => {
                        console.error('上传视频时出错:', error);
                    });

                // 重置录制状态和计时器
                setRecording(false);
                mediaChunks.current = [];
                clearInterval(timerRef.current);
                setRecordTime(0);

                //切换成播放场景
                setStage(3);

                //播放音频
                playAudio();
            };

            mediaRecorder.current.start();
            setRecording(true);
            // 启动计时器
            timerRef.current = setInterval(() => {
                setRecordTime((prevTime) => prevTime + 1);
            }, 1000);

        } catch (error) {
            console.error('获取用户媒体设备时出错:', error);
        }
    };


    const postRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop()
            clearInterval(timerRef.current);
            setRecording(false);
            setRecordTime(0)
        }
    };

    const cancelRecording = () => {
        mediaChunks.current = [];
        clearInterval(timerRef.current);
        setRecording(false);
        setRecordTime(0)
    }

    const pauseTiming = () => {
        // 暂停计时器
        clearInterval(timerRef.current);
    };

    const resumeTiming = () => {
        // 恢复计时器
        timerRef.current = setInterval(() => {
            setRecordTime((prevTime) => prevTime + 1);
        }, 1000);
    };


    return (
      <div className="container">
          {
              controlView ?
                  <div>
                      {stage === 0 ?
                          <div>
                              <div className="pic-box">
                                  <img src={default_pic} className="pic"/>
                              </div>
                              <div className="button-box">
                                  <button className="enter-button" onClick={() => {setStage(1);startRecording()}}  disabled={recording}>
                                      点击开始录制
                                  </button>
                              </div>
                          </div> : null}
                      {stage === 1 ?
                          <div>
                              <div className="pic-box">
                                  <img src={default_pic} className="pic"/>
                                  <video ref={videoRef} autoPlay playsInline style={{marginTop:50,width:"0%",borderRadius:"3em"}}/>
                                  <p className="text" style={{justifyContent:"center",display:'flex'}}>{!pauseTime?"正在录制...":"已暂停"}</p>
                              </div>
                              <div className="button-box" style={{flexDirection:"row",justifyContent:"center",gap:24,marginTop:50}}>
                                  <button className="cancel-button" onClick={() => {setStage(0);cancelRecording()}}>
                                      取消
                                  </button>
                                  <button className="send-button" onClick={() => {setStage(2);postRecording();}} disabled={!recording}>
                                      发送
                                  </button>
                                  {
                                      pauseTime?
                                          <button className="stop-button" onClick={() => {setPauseTime(false);resumeTiming()}} >
                                              继续
                                          </button>:
                                          <button className="stop-button" onClick={() => {setPauseTime(true);pauseTiming()}} >
                                              暂停
                                          </button>
                                  }
                              </div>
                          </div> : null}
                      {stage === 2 ?
                          <div>
                              <div className="pic-box">
                                  <img src={default_pic} className="pic"/>
                              </div>
                              <div className="button-box">
                                  正在处理...
                              </div>
                          </div> : null}
                      {stage === 3 ?
                          <div>
                              <div className="pic-box">
                                  <img src={default_pic} className="pic"/>
                                  <audio ref={audioRef} controls style={{marginTop:50,width:"100%",borderRadius:"3em"}}>
                                      <source src={audioSrc} type="audio/mpeg" />
                                      您的浏览器不支持音频标签。
                                  </audio>
                              </div>
                              <div className="button-box" style={{flexDirection:"row",justifyContent:"center",gap:12,marginTop:"0vh"}}>

                                  <button className="replay-button" onClick={replayAudio}>
                                      重播
                                  </button>
                                  <button className="create-button" onClick={() => {setPauseTime(false);setStage(1);startRecording();}}>
                                      创建新的对话
                                  </button>
                                  <button className="continue-button" onClick={() => {setPauseTime(false);setStage(1);startRecording()}}>
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
