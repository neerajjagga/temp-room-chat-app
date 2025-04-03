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
  const [creatingRoom, setCreatingRoom] = useState(false);

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
        setMessages((prevMessages) => [...prevMessages, { name: fromName, message }]);
      });

      socket.on("roomJoined", ({ message }) => {
        setIsRoomJoined(true);
        toast.success(message);
      });

      socket.on("updateUsersList", ({ users }) => {
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
    setCreatingRoom(true);
    const roomCode = nanoid(8);
    socket.emit("createRoom", { roomId: roomCode }, () => {
      setRoomCode(roomCode);
      setCreatingRoom(false);
      toast.success("Room created successfully");
    });
  }

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Room code copied to clipboard!");
    } catch (error) {
      console.error("Error copying text: ", err);
      toast.error("Error copying text");
    }
  }

  const handleSubmit = async (e) => {
    setJoiningRoom(true);
    e.preventDefault();
    socket.emit("joinRoom", { name: formData.name, roomId: formData.roomCode }, ({ status, message }) => {
      setJoiningRoom(false);
      if (!status) {
        toast.error(message);
      } else {
        toast.success("Room joined successfully");
      }
    });
  }

  const handleSendMessage = () => {
    if (!formData.message.trim()) return;
    socket.emit("sendMessage", { fromName: formData.name, message: formData.message, roomId: formData.roomCode });
    setFormData({ ...formData, message: '' });
  }

  const handleLeaveRoom = () => {
    socket.emit("leaveRoom", { name: formData.name, roomId: formData.roomCode }, () => {
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
        <div className='xl:w-[42%] lg:w-[60%] w-[95%] container border border-gray-800 py-3 rounded-2xl flex flex-col gap-6'>
          <div className='flex flex-col gap-1'>
            <div className='flex gap-2 items-center'>
              <i className="ri-chat-3-line lg:text-3xl text-2xl"></i>
              <h1 className='font-medium lg:text-3xl text-xl'>Real Time Chat</h1>
            </div>
            <p className='lg:text-sm text-xs text-gray-400'>temporary room that expires after all users exit
            </p>
          </div>

          {!isRoomJoined ? (
            <div className='flex flex-col gap-6'>
              <div>
                <button
                  onClick={handleCreateNewRoom}
                  disabled={creatingRoom}
                  className={`w-full lg:text-xl text-sm mt-2 ${creatingRoom ? "bg-gray-300" : "bg-[#fafafa]"} text-black py-2 font-bold rounded-lg flex gap-2 items-center justify-center`}>
                  Create New Room
                  {creatingRoom && (<i className="ri-loader-2-line text-xl animate-spin"></i>)}
                </button>
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
                      className={`md:w-[40%] lg:text-xl text-sm mt-2 md:mt-0 w-full ${joiningRoom ? "bg-gray-300" : "bg-[#fafafa]"} text-black py-2 font-bold rounded-lg flex gap-2 items-center justify-center`} type='submit'>
                      Join Room
                      {joiningRoom && (<i className="ri-loader-2-line text-xl animate-spin"></i>)}
                    </button>
                  </div>
                </form>

              </div>

              {roomCode && (
                <div className='flex flex-col items-center py-4 gap-3 rounded-md text-gray-300 bg-[#272627]'>
                  <p className='sm:text-sm text-xs'>
                    Share this code with your friend
                  </p>

                  <div className='flex gap-6 items-center'>
                    <span className='lg:text-2xl text-xl font-bold'>{roomCode}</span>
                    <button onClick={() => copyToClipboard(roomCode)}>
                      <i className="ri-file-copy-line lg:text-2xl text-xl"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='flex flex-col gap-4'>
              <div className='w-full lg:h-16 h-[5rem] rounded-xl bg-[#272627] flex items-center justify-between text-gray-300'>
                <div className='flex flex-col lg:flex-row w-full justify-between container items-center'>
                  <div className='flex gap-3 items-center'>
                    <h1 className='text-sm sm:text-md lg:text-lg'>Room Code: <span className='font-bold'>{formData.roomCode}</span></h1>
                    <button className='' onClick={() => copyToClipboard(formData.roomCode)}>
                      <i className="ri-file-copy-line text-xl"></i>
                    </button>
                  </div>

                  <div className='flex items-center justify-between gap-10'>
                    <div className='text-sm sm:text-md lg:text-lg'>
                      Users: {usersList}
                    </div>

                    <div
                      className='flex items-center gap-2 text-sm sm:text-md lg:text-lg'>
                      <span>Exit: </span>
                      <i
                        onClick={handleLeaveRoom}
                        className="ri-door-closed-line md:text-3xl text-2xl hover:bg-gray-700 py-1 px-2 rounded-full transition-all duration-300 ease-out cursor-pointer"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className='w-full h-[22rem] bg-black border border-gray-800 rounded-xl overflow-y-auto px-6 py-4 flex flex-col gap-4 chat-container no-scrollbar'>
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
                  className='lg:w-[20%] w-[30%] bg-white text-black font-bold rounded-lg'>
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
