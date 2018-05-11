<template>
  <div class="container">
    <div class="name">
      <h3>Name：{{ userName }}</h3>
      <div class="reset" @click="setName()">Reset Name</div>
    </div>
    <div class="chatRoom">
      <div class="roomHead">
        <div class="roomHead__topButtons">
          <div class="roomHead__button close"></div>
          <div class="roomHead__button minimize"></div>
          <div class="roomHead__button zoom"></div>
        </div>
        <img src="../assets/client.jpg" class="roomHead__img" draggable="false">
        <div class="roomHead__title">Anonymous</div>
      </div>
      <div id="js-roomBody" class="roomBody">
        <template v-for="item in messages">
          <template v-if="item.userName != userName">
            <div class="messageBox">
              <img src="../assets/client.jpg" class="messageBox__user" draggable="false">
              <div class="messageBox__content">
                <div class="messageBox__name">{{item.userName}}</div>
                <div v-if="item.type == 'text'" class="messageBox__message">
                  <div class="messageBox__text">{{item.message}}</div>
                  <div class="messageBox__readMore" @click="readMore($event)">Show more</div>
                </div>
                <div v-if="item.type == 'image'" class="messageBox__image"><img :src="item.message"></div>
              </div>
              <div class="messageBox__time">{{item.timeStamp}}</div>
            </div>
          </template>
          <template v-if="item.userName == userName">
            <div class="messageBox messageBox--self">
              <div class="messageBox__time">{{item.timeStamp}}</div>
              <div class="messageBox__content">
                <div v-if="item.type == 'text'" class="messageBox__message">
                  <div class="messageBox__text">{{item.message}}</div>
                </div>
                <div v-if="item.type == 'image'" class="messageBox__image"><img :src="item.message"></div>
              </div>
            </div>
          </template>
        </template>
        <div v-show="upload" class="messageBox messageBox--self">
          <div class="messageBox__progress">
            <div id="js-progressBar" class="messageBox__progress--state"></div>
            <div class="messageBox__progress--number">{{progress}}</div>
          </div>
        </div>
      </div>
      <div class="roomBottom" :class="{ disable: !userName }">
        <div class="roomBottom__tools">
          <div class="roomBottom__tools_upload">
            <input type="file" accept="image/*" @change="sendImage($event)">
            <img src="../assets/tools_file.png">
          </div>
        </div>
        <div class="roomBottom__input">
          <textarea id="js-message" class="roomBottom__input__textarea" :class="{ disable: !userName }" @keydown.enter="sendMessage($event)"></textarea>
        </div>
      </div>
    </div>
    <div v-show="userNameSet || userName == ''" class="modal">
      <div class="modal__container">
        <header class="modal__header">
          <h2 class="view-title">Enter your ID</h2>
        </header>
        <div class="modal__body">
          <input type="text" id="js-userName" class="userName" maxlength="6" @keydown.enter="saveName()" :value="userName">
          <div class="button" @click="saveName()">Save</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const msgRef = firebase.database().ref('/messages/');
const storageRef = firebase.storage().ref('/images/');
export default {
  name: 'ChatRoom',
  data() {
    return {
      userNameSet: false,
      userName: '',
      messages: [],
      upload: false, 
      progress: ''
    }
  },
  methods: {
    setName() {
      const vm = this;
      vm.userNameSet = true;
    },
    saveName() {
      const vm = this;
      const userName = document.querySelector('#js-userName').value;
      if (userName.trim() == '') { return; }
      vm.userName = userName;
      vm.userNameSet = false;
    },
    getTime() {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      return `${(hours >= 12) ? "下午" : "上午"} ${hours}:${(minutes < 10) ? '0' + minutes : minutes}`;
    },
    sendMessage(e) {
      const vm = this;
      const userName = document.querySelector('#js-userName');
      let message = document.querySelector('#js-message');
      if (e.shiftKey) {
        return false;
      }
      if (message.value.length <= 1 && message.value.trim() == '') {
        e.preventDefault();
        return false;
      }
      msgRef.push({
        userName: userName.value,
        type: 'text',
        message: message.value,
        timeStamp: vm.getTime()
      })
      message.value = '';
      e.preventDefault();
    },
    sendImage(e) {
      const vm = this;
      const userName = document.querySelector('#js-userName');
      const file = e.target.files[0];
      const fileName = Math.floor(Date.now() / 1000) + `_${file.name}`;
      const metadata = {
        contentType: 'image/*'
      };
      let progressBar = document.querySelector('#js-progressBar');
      const uploadTask = storageRef.child(fileName).put(file, metadata);
      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
        function(snapshot) {
          let progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (progress < 100) {
            vm.upload = true;
            vm.progress = `${progress}%`;
            progressBar.setAttribute('style', `width:${progress}%`);
          }
        },
        function(error) {
          msgRef.child('bug/').push({
            userName: userName.value,
            type: 'image',
            message: error.code,
            timeStamp: vm.getTime()
          })
        },
        function() {
          var downloadURL = uploadTask.snapshot.downloadURL;
          msgRef.push({
            userName: userName.value,
            type: 'image',
            message: downloadURL,
            timeStamp: vm.getTime()
          })
          vm.upload = false;
        });
    },
    readMore(e) {
      e.target.previousElementSibling.setAttribute('style', 'max-height: 100%;')
      e.target.setAttribute('style', 'display: none;');
    }
  },
  mounted() {
    const vm = this;
    msgRef.on('value', function(snapshot) {
      const val = snapshot.val();
      vm.messages = val;
    })
  },
  updated() {
    const messages = document.querySelectorAll('.messageBox__message');
    messages.forEach((message) => {
      if (message.offsetHeight > 300) {
        message.querySelector('.messageBox__readMore').setAttribute('style', 'display: block');
      }
    })
    const roomBody = document.querySelector('#js-roomBody');
    roomBody.scrollTop = roomBody.scrollHeight;
  }
}
</script>

<style scoped>
* {
  font-family: '微軟正黑體';
  margin: auto;
}
.container {
  width: 100%;
}
.name {
  text-align: center;
  margin: 10px 0px 30px 0;
  color: #333333;
  text-align: center;
  width: 100%;
}
.reset {
  margin-top: 10px;
  padding: 5px 10px;
  border-radius: 10px;
  font-weight: 600;
  color: #333333;
  background-color: #CCCCCC;
  display: inline-block;
  cursor: pointer;
}
.chatRoom {
  border-radius: 5px;
  max-width: 500px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
}
/* Head */
.roomHead {
  width: 100%;
  height: 85px;
  border-radius: 5px 5px 0px 0px;
  background-color: #2B364B;
  position: relative;
  padding: 0 0 14px 0;
}
.roomHead__topButtons {
  padding: 2px 0px 5px 10px;
  text-align: left;
}
.roomHead__button {
  height: 10px;
  width: 10px;
  border-radius: 50%;
  margin: 0px 1px;
  display: inline-block;
  cursor: pointer;
}
.close {
  background-color: #FF625A;
}
.minimize {
  background-color: #FFC02F;
}
.zoom {
  background-color: #28CB40;
}
.roomHead__img {
  width: 50px;
  height: 50px;
  margin: 0px 10px 6px 12px;
  border-radius: 50%;
  position: absolute;
  cursor: pointer;
}
.roomHead__title {
  font-size: 13px;
  font-weight: 600;
  color: #FFFFFF;
  height: 80px;
  margin: 15px 0px 0px 155px;
  position: absolute;
  cursor: pointer;
}
/* Body */
.roomBody {
  padding: 10px 0px;
  background-color: #fff;
  height: 60vh;
  overflow-y: auto;
  overflow-x: hidden;
}
.messageBox {
  padding: 5px 10px;
  position: relative;
}
.messageBox__user {
  height: 40px;
  width: 40px;
  border-radius: 50%;
  vertical-align: top;
  display: inline-block;
  cursor: pointer;
}
.messageBox__content {
  max-width: 70%;
  display: inline-block;
}
.messageBox__name {
  margin: 5px 0px 5px 5px;
  font-size: 13px;
  color: #727C8A;
  vertical-align: top;
  cursor: pointer;
}
.messageBox__message {
  margin: 5px 0px 5px 5px;
  font-size: 12px;
  color: #35393D;
  letter-spacing: 0.6px;
  background-color: #E3E8EB;
  border-radius: 12px;
  line-height: 1.5;
  text-align: left;
  word-break: break-all;
  /*：與html的<pre></pre>同效果，可以使textarea的換行元素正常顯示 */
  white-space: pre-line;
}
.messageBox__text {
  padding: 8px 10px 9px 11px;
  max-height: 300px;
  overflow: hidden;
}
.messageBox__readMore {
  border-top: 1px solid #D9DBDD;
  margin-top: 6px;
  padding: 6px 13px 10px 13px;
  left: 0;
  right: 0;
  cursor: pointer;
  display: none;
}
.messageBox__image {
  margin: 5px 25px 5px 5px;
}
.messageBox__image img {
  border-radius: 5px;
  max-width: 100%;
  max-height: 335px;
}
.messageBox__time {
  transform: scale(0.7);
  color: #ACB0B8;
  vertical-align: bottom;
  margin: 0px 0px 5px -12px;
  display: inline-block;
}
.messageBox__progress {
  width: 25%;
  margin-right: 60px;
  border-radius: 5px;
  background-color: #D4D9E1;
  height: 6px;
}
.messageBox__progress--state {
  background-color: #00CE00;
  height: 6px;
  width: 10%;
  border-radius: 5px;
  float: right;
}
.messageBox__progress--number {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 12px;
  color: #B7B7B7;
  margin-right: 35px;
}
.messageBox--self {
  text-align: right;
}
.messageBox--self .messageBox__message {
  background-color: #AFF47E;
  margin-right: 25px;
}
.messageBox--self .messageBox__message__text {
  padding: 8px 10px 9px 11px;
  max-height: 100%;
  overflow: unset;
}
.messageBox--self .messageBox__time {
  margin: 0px -16px 5px 0px;
}
/* Bottom */
.roomBottom {
  bottom: 0px;
  border-radius: 0px 0px 5px 5px;
  background-color: #FFFFFF;
}
.roomBottom__tools {
  border-top: solid 1px #E7E7E7;
  border-bottom: solid 2px #E7E7E7;
  background-color: #F6F6F6;
  height: 30px;
  padding: 0px 5px;
}
.roomBottom__tools_upload {
  height: 20px;
  margin: 5px;
  padding: 1px;
  display: inline-block;
  position: relative;
  overflow: hidden;
}
.roomBottom__tools_upload:hover {
  border: solid 1px #DCDCDC;
}
.roomBottom__tools_upload input {
  width: 100%;
  height: 100%;
  left: 0;
  right: 0;
  opacity: 0;
  position: absolute;
  cursor: pointer;
  /* 讓input file可以支援pointer要加pl100% */
  padding-left: 100%;
}
.roomBottom__tools_upload img {
  height: 100%;
}
.roomBottom__input {
  padding: 10px 10px 5px 10px;
}
.roomBottom__input__textarea {
  width: 100%;
  height: 60px;
  border: none;
  resize: none;
  outline: none;
}
/* status */
.disable {
  pointer-events: none;
  background-color: #ebebeb;
}
/* modal */
.modal {
  z-index: 3;
  padding: 50px 0px;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
  animation: opac 0.8s;
  letter-spacing: 2px;
  text-align: unset;
}
.modal__container {
  margin: auto;
  position: relative;
  padding: 10px;
  outline: 0;
  max-width: 300px;
}
.modal__header {
  color: #fff;
  background-color: #2B364B;
  padding: 10px;
  text-align: center;
  border-radius: 5px 5px 0px 0px;
}
.modal__body {
  background-color: #fff;
  padding: 20px 50px;
  text-align: center;
  border-radius: 0 0 5px 5px;
}
.modal__body p {
  text-align: left;
  line-height: 24px;
}
.modal__img {
  max-width: 100%;
}
/* name set */
.userName {
  height: 30px;
  font-size: 16px;
  margin-bottom: 10px;
  border: solid 1px #cbcbcb;
  width: 70%;
  text-align: center;
  display: inline-block;
}
.button {
  font-size: 14px;
  color: #FFFFFF;
  background-color: #2B364B;
  padding: 10px 40px;
  display: inline-block;
  cursor: pointer;
  border-radius: 40px;
}
/* media */
@media screen and (max-width: 425px) {
  .messageBox__content {
    max-width: 60%;
  }
}
@media screen and (max-width: 385px) {
  .messageBox__content {
    max-width: 50%;
  }
}
</style>