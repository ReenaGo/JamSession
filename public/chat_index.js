$(document).ready(function() {
    let username = firstName;
    let chatChannel;
  
    while (!username) {
      getUsername();
    }
  
    getToken()
      .then(token => {
        console.log("returned token is ", token);
        return Twilio.Chat.Client.create(token, { logLevel: "debug" });
      })
      .then(client => {
        getChannelDescriptor(client)
          .then(channel => channel.getChannel())
          .then(channel => channel.join())
          .then(channel => {
            chatSetupCompleted();
            chatChannel = channel;
            channel.on("messageAdded", onMessageAdded);
            activateChatBox();
          });
      })
      .catch(
        error =>
          console.log("error setting up twilio", error) || chatSetupFailed()
      );
  
    function getUsername() {
      username = prompt("Enter a username");
    }
  
    function getToken() {
      return fetch(`/chatToken?username=${username}`)
        .then(response => {
          if (response.ok) {
            return response.text();
          }
  
          throw new Error("Network response was not ok.");
        })
        .catch(error => console.log("Error fetching token", error) || error);
    }
  
    function getChannelDescriptor(chatClient) {
      return chatClient
        .getPublicChannelDescriptors()
        .then(function(paginator) {
          if (paginator.items.length > 0) 
          {
              
            //if channel exists, then join that channel instead of creating a new one
            for (i = 0; i < paginator.items.length; i++) {
                const channel = paginator.items[i];
                if (comName == channel.friendlyName) {
                  return channel;
                };
                //console.log('Channel: ' + channel.friendlyName);
              }          
            }
          
          else {
              //if channel doesn't exist, create a new channel
            chatClient
              .createChannel({
                uniqueName: comName,
                friendlyName: comName
              })
              .then(function(newChannel) {
                console.log("Created general channel:");
                console.log(newChannel);
                return newChannel;
              });
          }
        })
        .then(channel => channel)
        .catch(error => console.log("error getting channel", error) || error);
    }
  
    function onMessageAdded(message) {
      let template = $("#new-message").html();
      template = template.replace(
        "{{body}}",
        `<b>${message.author}:</b> ${message.body}`
      );
  
      $(".chat").append(template);
      var body_panel = document.getElementById("body-panel");
      body_panel.scrollTop = body_panel.scrollHeight;
    }
  
    function chatSetupCompleted() {
      let template = $("#new-message").html();
      template = template.replace(
        "{{body}}",
        "<b>Chat Setup Completed. Start your conversation!</b>"
      );
  
      $(".chat").append(template);
    }
  
    function chatSetupFailed() {
      let template = $("#new-message").html();
      template = template.replace(
        "{{body}}",
        "<b>Chat Setup Failed. Contact Admin.</b>"
      );
  
      $(".chat").append(template);
    }
  
    function activateChatBox() {
      $("#message").removeAttr("disabled");
      $("#btn-chat").click(function() {
        const message = $("#message").val();
        $("#message").val("");
  
        //send message
        chatChannel.sendMessage(message);
        
      });
  
      $("#message").on("keydown", function(e) {
        if (e.keyCode === 13) {
          $("#btn-chat").click();
        }
      });
    }

  var body_panel = document.getElementById("body-panel");
  console.log(body_panel)
  console.log(body_panel.scrollTop)
  console.log(body_panel.scrollHeight)
  body_panel.scrollTop = body_panel.scrollHeight;

  });

