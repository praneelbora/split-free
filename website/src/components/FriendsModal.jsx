import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Share2 } from "lucide-react";

export default function Navbar({ setShowModal, showModal, fetchFriends }) {
    const { userToken, user } = useAuth()
    const [val, setVal] = useState('')
    const [sent, setSent] = useState([])
    const [received, setreceived] = useState([])
    const addFriend = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v1/friends/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': userToken,
                },
                body: JSON.stringify({ email: val }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Show meaningful message from backend if exists
                const errorMsg = data.message || data.error || "Failed to send friend request";
                alert(errorMsg); // or use toast(errorMsg)
                return;
            }

            // Success: refresh lists and close modal
            fetchFriends();
            sentRequests();
            receivedRequests();
            setShowModal(false);
            alert(data.message || "Friend request sent"); // Optional success message

        } catch (error) {
            console.error("Error Sending Request:", error);
            alert("Something went wrong. Please try again.");
        }
    };

    const accept = async (id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v1/friends/accept`, {
                headers: {
                    "Content-Type": "application/json",
                    'x-auth-token': userToken
                },
                method: 'POST',
                body: JSON.stringify({ requestId: id })
            });

            if (!response.ok) {
                throw new Error("Failed to add friend");
            }
            else {
                fetchFriends()
                sentRequests()
                receivedRequests()
                setShowModal(false)
            }
        } catch (error) {
            console.error("Error Sending Request:", error);
        }
    };
    const reject = async (id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v1/friends/reject`, {
                headers: {
                    "Content-Type": "application/json",
                    'x-auth-token': userToken
                },
                method: 'POST',
                body: JSON.stringify({ requestId: id })
            });

            if (!response.ok) {
                throw new Error("Failed to add friend");
            }
            else {
                fetchFriends()
                sentRequests()
                receivedRequests()
                setShowModal(false)
            }
        } catch (error) {
            console.error("Error Sending Request:", error);
        }
    };

    const cancel = async (id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v1/friends/cancel`, {
                headers: {
                    "Content-Type": "application/json",
                    'x-auth-token': userToken
                },
                method: 'POST',
                body: JSON.stringify({ requestId: id })
            });

            if (!response.ok) {
                throw new Error("Failed to add friend");
            }
            else {
                fetchFriends()
                sentRequests()
                receivedRequests()
                setShowModal(false)
            }
        } catch (error) {
            console.error("Error Sending Request:", error);
        }
    };

    const sentRequests = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v1/friends/sent`, {
                headers: {
                    "Content-Type": "application/json",
                    'x-auth-token': userToken
                },
            });

            if (!response.ok) {
                throw new Error("Failed to add friend");
            }
            else {
                const responseJson = await response.json()
                console.log(responseJson);

                setSent(responseJson)
            }
        } catch (error) {
            console.error("Error Sending Request:", error);
        }
    };
    const receivedRequests = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v1/friends/received`, {
                headers: {
                    "Content-Type": "application/json",
                    'x-auth-token': userToken
                },
            });

            if (!response.ok) {
                throw new Error("Failed to add friend");
            }
            else {
                setreceived(await response.json())
            }
        } catch (error) {
            console.error("Error Sending Request:", error);
        }
    };
    useEffect(() => {
        sentRequests()
        receivedRequests()
    }, [])

    if (showModal) return (

        <>
            <div
                className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-[5000] outline-none focus:outline-none backdrop-blur-sm bg-[rgba(0,0,0,0.2)]"
                onClick={() => setShowModal(false)}
            >
                <div className="relative my-6 mx-auto w-[95dvw] lg:w-[80dvw] xl:w-[40dvw] h-auto" onClick={(e) => e.stopPropagation()}>
                    {/*content*/}
                    <div className="rounded-[24px] shadow-lg relative flex flex-col w-full bg-[#212121]">
                        {/*header*/}
                        <div className="flex items-start justify-between px-5 py-3 border-b border-solid border-[rgba(255,255,255,0.1)]">
                            <h3 className="text-2xl font-semibold text-[#EBF1D5]">
                                Friends
                            </h3>
                            <button
                                className="absolute top-[13px] right-[12px] p-1 ml-auto bg-transparent border-0 text-[#EBF1D5] float-right text-2xl leading-none font-semibold outline-none focus:outline-none"
                                onClick={() => setShowModal(false)}
                            >
                                <span className="bg-transparent text-[#EBF1D5] h-6 w-6 block outline-none focus:outline-none">
                                    ×
                                </span>
                            </button>
                        </div>

                        {/*body*/}
                        <div className="w-full flex flex-col p-5 gap-6">
                            <div className="w-full flex flex-row gap-3 items-center">
    <input
        className="bg-[#1f1f1f] text-[#EBF1D5] border border-[#55554f] rounded-md p-2 text-base min-h-[40px] pl-3 flex-1"
        placeholder='Enter Email ID'
        value={val}
        onChange={(e) => setVal(e.target.value)}
    />
    <button
        className="border-[#EBF1D5] text-[#EBF1D5] border-[1px] h-[40px] px-2 rounded-md"
        onClick={() => addFriend()}
    >
        Add
    </button>
    <button
        className="flex items-center justify-center w-[40px] h-[40px] rounded-full shadow-md border border-[#EBF1D5] text-[#EBF1D5]"
        onClick={() => {
            const friendLink = `${import.meta.env.VITE_FRONTEND_URL}/friends/add/${user._id}`;
            const message = `Let's connect on SplitFree! 🤝\n\nTap this link to login and send me a friend request:\n${friendLink}`;

            if (navigator.share) {
                navigator
                    .share({
                        title: "Add me on SplitFree!",
                        text: message,
                        url: friendLink,
                    })
                    .then(() => console.log("Shared successfully"))
                    .catch((err) => console.error("Sharing failed", err));
            } else {
                navigator.clipboard.writeText(message);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }}
    >
        <Share2 strokeWidth={2} size={20} />
    </button>
</div>

                            <div className="w-full gap-3">
                                {received.length > 0 &&
                                    <div className="flex flex-col gap-2">
                                        <p className="uppercase text-[#EBF1D5]">Received Requests</p>
                                        <div className="w-full flex flex-col">
                                            <hr />
                                            {received.map((req) => {
                                                return (
                                                    <div className="flex flex-col gap-2 pt-2">
                                                        <div className="flex flex-row w-full h-[50px] justify-between items-center">
                                                            <div className="flex flex-col h-full justify-around">
                                                                <p className="text-[20px] text-[#EBF1D5] capitalize">{req.sender.name}</p>
                                                                <p className="text-[12px] text-[#EBF1D5] lowercase">{req.sender.email}</p>
                                                            </div>
                                                            <div className="flex flex-row w-min gap-2">
                                                                <button className="border-[#34C759] text-[#34C759] border-[1px] h-[40px] px-2 rounded-md" onClick={() => accept(req._id)}>Accept</button>
                                                                <button className="border-[#EA4335] text-[#EA4335] border-[1px] h-[40px] px-3 rounded-md" onClick={() => reject(req._id)}>X</button>
                                                            </div>
                                                        </div>
                                                        <hr />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>}
                                {sent.length > 0 &&
                                    <div className="flex flex-col gap-2">
                                        <p className="uppercase text-[#EBF1D5]">Sent Requests</p>
                                        <div className="w-full flex flex-col">
                                            <hr />
                                            {sent.map((req) => {
                                                return (
                                                    <div className="flex flex-col gap-2 pt-2">
                                                        <div className="flex flex-row w-full h-[50px] justify-between items-center">
                                                            <div className="flex flex-col h-full justify-around">
                                                                <p className="text-[20px] text-[#EBF1D5] capitalize">{req.receiver.name}</p>
                                                                <p className="text-[12px] text-[#EBF1D5] lowercase">{req.receiver.email}</p>
                                                            </div>
                                                            <div className="flex flex-row w-min">
                                                                <button className="border-[#EA4335] text-[#EA4335] border-[1px] h-[40px] px-2 rounded-md" onClick={() => cancel(req._id)}>Cancel</button>
                                                            </div>
                                                        </div>
                                                        <hr />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
    );
}
