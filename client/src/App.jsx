import { useEffect, useState } from 'react';
import './App.css'
import { nanoid } from 'nanoid';
import { Toaster, toast } from 'react-hot-toast'
import { makeSocketConnection } from './lib/socket';

function App() {
  const [roomCode, setRoomCode] = useState('');
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const [socket, setSocket] = useState();
  const [messages, setMessages] = useState([]);
  const [usersList, setUsersList] = useState(0);
  const [joiningRoom, setJoiningRoom] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    roomCode: '',
    message: '',
  });

  useEffect(() => {
    const setupSocket = async () => {
      const socket = await makeSocketConnection();
      setSocket(socket);

      socket.on("messageReceived", ({ fromName, message }) => {
        console.log("Inside useEffect message received");
        setMessages((prevMessages) => [...prevMessages, { name: fromName, message }]);
      });

      socket.on("roomJoined", ({ message }) => {
        setIsRoomJoined(true);
        toast.success(message);
      });

      socket.on("updateUsersList", ({ users }) => {
        console.log(users);
        console.log("Inside updateUsersList");
        setUsersList(users.length);
      });
    }

    setupSocket();

    return () => {
      if (socket) {
        socket.emit("leaveRoom", { name: formData.name, roomId: roomCode });
        socket.off("messageReceived");
        socket.off("roomJoined");
      }
    }
  }, []);

  useEffect(() => {
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleCreateNewRoom = () => {
    const roomCode = nanoid(8);
    setRoomCode(roomCode);
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success("Room code copied to clipboard!");
    } catch (error) {
      console.error("Error copying text: ", err);
      toast.error("Error copying text");
    }
  }

  const handleSubmit = async (e) => {
    console.log("Inside handleSubmit");
    setJoiningRoom(true);
    e.preventDefault();
    socket.emit("joinRoom", { name: formData.name, roomId: formData.roomCode }, () => {
      setJoiningRoom(false);
    });
  }

  const handleSendMessage = () => {
    if (!formData.message.trim()) return;
    socket.emit("sendMessage", { fromName: formData.name, message: formData.message, roomId: formData.roomCode });
    setFormData({ ...formData, message: '' });
  }

  const handleLeaveRoom = () => {
    console.log(formData);
    console.log(roomCode);
    
    socket.emit("leaveRoom", { name: formData.name, roomId: roomCode }, () => {
      setIsRoomJoined(false);
      setJoiningRoom(false);
      setRoomCode('');
      setMessages([]);
      formData.name = ''
      formData.roomCode = ''
      formData.message = ''
    });
  }

  return (
    <>
      <div className='h-screen bg-[#0b0b0a] flex justify-center items-center  font-JetBrains text-white'>
        <div className='xl:w-[42%] lg:w-[60%] w-[95%] container border border-gray-800 py-5 rounded-2xl flex flex-col gap-6'>
          <div className='flex flex-col gap-1'>
            <div className='flex gap-2 items-center'>
              <i className="ri-chat-3-line text-3xl"></i>
              <h1 className='font-medium md:text-3xl text-2xl'>Real Time Chat</h1>
            </div>
            <p className='text-sm text-gray-400'>temporary room that expires after all users exit
            </p>
          </div>

          {!isRoomJoined ? (
            <div className='flex flex-col gap-6'>
              <div>
                <button
                  onClick={handleCreateNewRoom}
                  disabled={joiningRoom}
                  className={`w-full text-black py-2 font-bold text-xl rounded-lg ${joiningRoom ? "bg-gray-300" : "bg-[#fafafa]"}`}>Create New Room</button>
              </div>

              <div>

                <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    type="text"
                    className='bg-[#0b0b0a] border border-gray-800 w-full py-2 px-4 rounded-lg focus:outline-none'
                    placeholder='Enter your name'
                    required
                  />

                  <div className='flex gap-2 flex-col md:flex-row'>
                    <input
                      value={formData.roomCode}
                      onChange={(e) => setFormData({ ...formData, roomCode: e.target.value })}
                      type="text"
                      className='bg-[#0b0b0a] border border-gray-800 w-full py-2 px-4 rounded-lg focus:outline-none'
                      placeholder='Enter room code'
                      required
                    />

                    <button
                      disabled={joiningRoom}
                      className={`md:w-[40%] w-full ${joiningRoom ? "bg-gray-300" : "bg-[#fafafa]"} text-black py-2 font-bold rounded-lg flex gap-2 items-center justify-center`} type='submit'>
                      Join Room
                      {joiningRoom && (<i className="ri-loader-2-line text-xl animate-spin"></i>)}
                    </button>
                  </div>
                </form>

              </div>

              {roomCode && (
                <div className='flex flex-col items-center py-4 gap-3 rounded-md text-gray-300 bg-[#272627]'>
                  <p className='text-sm '>
                    Share this code with your friend
                  </p>

                  <div className='flex gap-6 items-center'>
                    <span className='text-2xl font-bold'>{roomCode}</span>
                    <button onClick={copyToClipboard}>
                      <i className="ri-file-copy-line text-2xl"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='flex flex-col gap-6'>
              <div className='w-full h-16 rounded-xl bg-[#272627] flex items-center justify-between text-gray-300'>
                <div className='flex w-full justify-between container items-center'>
                  <div className='flex gap-3 items-center'>
                    <h1>Room Code: <span className='font-bold'>{roomCode}</span></h1>
                    <button onClick={copyToClipboard}>
                      <i className="ri-file-copy-line text-xl"></i>
                    </button>
                  </div>

                  <div>
                    Users: {usersList}
                  </div>

                  <div
                    onClick={handleLeaveRoom}
                    className='hover:bg-gray-700 rounded-full py-1 px-2 transition-all duration-300 ease-out cursor-pointer'>
                    <i className="ri-door-closed-line text-3xl"></i>
                  </div>
                </div>
              </div>

              <div className='w-full h-80 bg-black border border-gray-800 rounded-xl overflow-y-auto px-6 py-4 flex flex-col gap-4 chat-container'>
                {messages.length > 0 && (
                  messages.map((chat, index) => {
                    return <div key={index} className={`h-auto text-black flex flex-col gap-1 ${chat.name === formData.name ? "items-end" : "items-start"}`}>
                      <span className='text-gray-400 text-xs'>{chat.name === formData.name ? "Me" : chat.name}</span>
                      <span className='bg-gray-300 px-2 py-2 rounded-lg font-semibold'>{chat.message}</span>
                    </div>
                  })
                )}
              </div>

              <div className='w-full h-12 bg-[#0b0b0a] py-1 flex gap-4'>
                <input
                  type="text"
                  className='h-full bg-[#0b0b0a] outline-none border border-gray-800 w-full rounded-lg px-4'
                  placeholder='Type a message...'
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                <button
                  onClick={handleSendMessage}
                  className='w-[20%] bg-white text-black font-bold rounded-lg'>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            border: "1px solid #2d2d2d",
            background: "#0b0b0a",
            color: "#fff",
          },
        }}
      />
    </>
  )
}

export default App
