   // 建立连接
   const socket = io.connect("/chatroom");

   // 编号
   let id = 0;

   // 允许输入的最大字数
   const maxInput = 30;

   // 用户头像
   let icon = 'https://i.niupic.com/images/2018/08/10/5yxS.jpg';

   // 用户姓名
   let name = '';

   getName();

   // 如果监听到socket消息，那么执行该回调函数，并得到广播消息
   // 此处的message参数是后台广播的内容
   socket.on("message", function(message) {
       console.log(message)
       let html = '';
       //				const container = document.getElementsByClassName("chat-container");
       if (name == message.name) {
           html = '<div class="message-self"><div class="message-container"><div class="message-content"><div class="name">' + message.name + '</div><div class="message">' + message.msg + '</div></div><div class="icon"><img src="' + icon + '" /></div></div></div>';
       } else {
           html = '<div class="message-other"><div class="message-container"><div class="icon"><img src="' + icon + '" /></div><div class="message-content"><div class="name">' + message.name + '</div><div class="message">' + message.msg + '</div></div></div></div>';
       }
       $(".chat-container").append(html);
       scrollToBottom();
   });

   // 接收到系统通知
   socket.on("joinNoticeSelf", function(message) {
       $("#count").text(message.count);
       id = message.id;
       $(".id").text(message.id + '号');
   });

   // 接收到系统通知
   socket.on("joinNoticeOther", function(message) {
       console.log("joinNoticeOther：");
       console.log(message);
       $("#count").text(message.count);
       const msg = {
           name: message.name,
           action: message.action
       }
       notify(msg);
   });

   // 断开连接回调事件
   socket.on("disconnection", function(message) {
       console.log(message);
       $("#count").text(message.count);
       const notifyMessage = {
           name: message.name,
           action: "退出了群聊"
       };
       notify(notifyMessage);
   });

   document.onkeydown = function(event) {
       var e = event || window.event || arguments.callee.caller.arguments[0];
       if (e && e.keyCode == 13) { // enter 键
           send();
       }
   };

   /**
    * 发送系统通知
    * 
    * @param {Object} message
    */
   function notify(message) {
       const notify = '<div class="notify-container"><div class="notify"><span class="name">' + message.name + '</span>' + message.action + '</div></div>';
       $(".chat-container").append(notify);
       scrollToBottom();
   }

   /**
    * 固定滚动条到底部
    */
   function scrollToBottom() {
       $(".chat-container").scrollTop($(".chat-container")[0].scrollHeight);
   }

   /**
    * 获取姓名
    */
   function getName() {
       const str = user.nickname;
       if (str) {
           name = str;
           console.log(name);
           $(".self-container .name").text(str);
           const message = {
               name: name
           }
           socket.emit("join", message);
       } else {
           getName();
       }
   }

   /**
    * 输入消息
    */
   function inputMessage() {
       const msg = $("#msg").val();
       const length = $("#msg").val().length;
       if (length > maxInput) {
           $("#msg").val(msg.substr(0, maxInput));
           $(".num").text(maxInput + '/' + maxInput);
       } else {
           const text = length + '/' + maxInput;
           $(".num").text(text);
       }
   }

   /**
    * 发送消息
    */
   function send() {
       var msg = $("#msg").val();

       if ("" == name) {
           getName();
       } else {
           if ("" == msg) {

           } else {
               const message = {
                   id: id,
                   name: name,
                   msg: msg
               };
               // 通过socket发送消息
               socket.send(message);
               scrollToBottom();
               $("#msg").val("");
               $(".num").text('0/' + maxInput);
           }
       }
   }