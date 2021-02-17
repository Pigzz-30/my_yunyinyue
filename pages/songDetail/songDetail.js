// pages/songDetail/songDetail.js
import PubSub from 'pubsub-js';
import moment from 'moment';
import request from '../../utils/request';
let appInstance = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false,
    song:{},
    musicId:'',
    musicLink:'',
    currentTime:'00:00',
    durationTime:'00:00',
    currentWidth:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let  musicId = options.musicId;
    if(appInstance.globalData.isMusicPLay && appInstance.globalData.musicId === musicId){
      this.setData({
        isPlay:true
      })
    }
    //创建音乐播放实例对象
    this.backgroundAudioManager = wx.getBackgroundAudioManager();
    this.backgroundAudioManager.onPlay(()=>{
      this.setData({
        isPlay:true
      })
      appInstance.globalData.isMusicPLay = true;
      appInstance.globalData.musicId = musicId;
    });
    this.backgroundAudioManager.onPause(()=>{
      this.setData({
        isPlay:false
      })
      appInstance.globalData.isMusicPLay = false;
    });
    this.backgroundAudioManager.onStop(()=>{
      this.setData({
        isPlay:false
      })
      appInstance.globalData.isMusicPLay = false;
    });
    this.backgroundAudioManager.onEnded(()=>{
      PubSub.publish('switchType','next');
      this.setData({
        currentWidth:0,
        currentTime:'00:00'
      })
      PubSub.subscribe('musicId',(msg,musicId)=>{
        this.getMusicInfo(musicId);
        this.musicControl(true,musicId)
        PubSub.unsubscribe('musicId')
      })
    })
    this.getMusicInfo(musicId);
    this.backgroundAudioManager.onTimeUpdate(()=>{
      let currentTime = moment(this.backgroundAudioManager.currentTime * 1000).format('mm:ss');
      let currentWidth = this.backgroundAudioManager.currentTime/this.backgroundAudioManager.duration * 450;
      this.setData({
        currentTime,
        currentWidth
      })
    });
    this.setData({
      musicId
    })
  },
  async getMusicInfo(musicId){
    let songData = await request('/song/detail',{ids:musicId});
    let durationTime = moment(songData.songs[0].dt).format('mm:ss');
    this.setData({
      song:songData.songs[0],
      durationTime
    })
    wx.setNavigationBarTitle({
      title: this.data.song.name,
    })
  },
  //点击播放或暂停的回调
  handleMusicPlay(){
    let isPlay = !this.data.isPlay;
    // this.setData({
    //   isPlay
    // })
    let {musicId,musicLink} = this.data;
    this.musicControl(isPlay,musicId,musicLink);
  },
  //控制音乐播放、暂停的功能函数
  async musicControl(isPlay,musicId,musicLink){
    if(isPlay){
      if(!musicLink){
        let musciLinkData = await request('/song/url',{id:musicId});
        musicLink = musciLinkData.data[0].url;
        this.setData({
          musicLink
        })
      }
      this.backgroundAudioManager.src = musicLink;
      this.backgroundAudioManager.title = this.data.song.name;
    }else{
      this.backgroundAudioManager.pause();
    }
  },
  //点击切歌的回调
  handleSwitch(event){
    //获取切歌类型
    let type = event.currentTarget.id;
    this.backgroundAudioManager.stop();
    PubSub.subscribe('musicId',(msg,musicId)=>{
      this.getMusicInfo(musicId);
      this.musicControl(true,musicId)
      PubSub.unsubscribe('musicId')
    })
    PubSub.publish('switchType',type);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})