import { useEffect, useState } from "react";
import React, { Fragment } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ExpenseModal from "../components/ExpenseModal"; // Adjust import path
import { useAuth } from "../context/AuthContext";
import SettleModal from '../components/SettleModal';
import { getGroupDetails, getGroupExpenses } from '../services/GroupService';
import Cookies from 'js-cookie';
import {
    Users,
    Wallet,
    Share2,
    List,
    User,
    Plus,
    Eye,
    EyeClosed,
    Settings,
    ChevronLeft,
    Loader
} from "lucide-react";
import { settleExpense } from '../services/ExpenseService';

const GroupDetails = () => {
    const { userToken } = useAuth() || {}
    const navigate = useNavigate()
    const { id } = useParams();
    const [group, setGroup] = useState(null);
    const [groupExpenses, setGroupExpenses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState();
    const [selectedMember, setSelectedMember] = useState(null);
    const [showMembers, setShowMembers] = useState(false);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [settleFrom, setSettleFrom] = useState('');
    const [settleTo, setSettleTo] = useState('');
    const [settleAmount, setSettleAmount] = useState('');
    const [copied, setCopied] = useState(false);
    const [adminEnforcedPrivacy, setAdminEnforcedPrivacy] = useState(false);

    const handleSettle = async ({ payerId, receiverId, amount, description }) => {
        try {
            await settleExpense({ payerId, receiverId, amount, description, groupId: id }, userToken);
            await getGroupExpenses(id, userToken);
            alert("Settlement recorded successfully!");
        } catch (err) {
            alert(err.message || "Could not settle the amount.");
        }
    };


    // Filtered expenses based on the selected member
    const filteredExpenses = selectedMember
        ? groupExpenses.filter(exp =>
            exp.splits.some(s =>
                s.friendId &&
                s.friendId._id === selectedMember &&
                (s.payAmount > 0 || s.oweAmount > 0)
            )
        )
        : groupExpenses;

    const getPayerInfo = (splits) => {
        const userSplit = splits.find(s => s.friendId && s.friendId._id === userId);

        if (!userSplit || (!userSplit.payAmount && !userSplit.oweAmount)) {
            return "You were not involved";
        }

        const payers = splits.filter(s => s.paying && s.payAmount > 0);
        if (payers.length === 1) {
            return `${payers[0].friendId._id == userId ? 'You' : payers[0].friendId.name} paid`;
        } else if (payers.length > 1) {
            return `${payers.length} people paid`;
        } else {
            return `No one paid`;
        }
    };

    const getSettleDirectionText = (splits) => {
        const payer = splits.find(s => s.paying && s.payAmount > 0);
        const receiver = splits.find(s => s.owing && s.oweAmount > 0);

        if (!payer || !receiver) return "Invalid settlement";

        const payerName = payer.friendId._id === userId ? "You" : payer.friendId.name;
        const receiverName = receiver.friendId._id === userId ? "you" : receiver.friendId.name;

        return `${payerName} paid ${receiverName}`;
    };



    const getOweInfo = (splits) => {
        const userSplit = splits.find(s => s.friendId && s.friendId._id === userId);

        if (!userSplit) return null;

        const { oweAmount = 0, payAmount = 0 } = userSplit;
        const net = payAmount - oweAmount;

        if (net > 0) {
            return { text: 'You lent', amount: ` ₹${net.toFixed(2)}` };
        } else if (net < 0) {
            return { text: 'You borrowed', amount: ` ₹${Math.abs(net).toFixed(2)}` };
        } else {
            return null;
        }
    };

    const fetchGroup = async () => {
        try {
            const data = await getGroupDetails(id, userToken)
            setGroup(data);
            setAdminEnforcedPrivacy(data?.settings?.enforcePrivacy || false);
        } catch (error) {
            // console.error("Group Details Page - Error loading group:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupExpenses = async () => {
    try {
        const data = await getGroupExpenses(id, userToken);
        console.log("Group Expense Data:", data);

        const allExpenses = data.expenses || [];
        const adminPrivacy = data.group?.settings?.enforcePrivacy ?? false;
        const currentUserId = data.id;

        console.log("Admin Privacy Enforced:", adminPrivacy);
        console.log("User ID:", currentUserId);

        // Filter based on privacy setting
        const filteredExpenses = allExpenses.filter(exp =>
            !adminPrivacy || exp.splits.some(split => (split.friendId?._id === currentUserId && (split.paying || split.owing)))
        );

        console.log("Filtered Expenses:", filteredExpenses);

        setGroupExpenses(filteredExpenses);
        setUserId(currentUserId); // assuming this is declared in useState

    } catch (error) {
        console.error("Error fetching group expenses:", error);
    }
};


    const calculateDebt = (groupExpenses, members) => {
        const totalDebt = {};

        // Initialize all members' total debts to 0
        members.forEach(member => {
            totalDebt[member._id] = 0;
        });
        // Calculate the total amount each member owes or is owed
        groupExpenses.forEach(exp => {
            exp.splits.forEach(split => {
                const { friendId, oweAmount, payAmount } = split;
                const memberId = friendId._id;

                if (payAmount > 0) {
                    // This person paid, so they are owed money
                    totalDebt[memberId] += payAmount;
                }

                if (oweAmount > 0) {
                    // This person owes money, so they have a negative debt
                    totalDebt[memberId] -= oweAmount;
                }
            });
        });
        return totalDebt;
    };

    // Simplify debts
    const simplifyDebts = (totalDebt, members) => {
        const owe = [];
        const owed = [];

        // Separate the people who owe money and the ones who are owed money
        for (let memberId in totalDebt) {
            if (totalDebt[memberId] > 0) {
                owed.push({ memberId, amount: totalDebt[memberId] });
            } else if (totalDebt[memberId] < 0) {
                owe.push({ memberId, amount: Math.abs(totalDebt[memberId]) });
            }
        }

        // Simplify the debts
        const transactions = [];
        let i = 0, j = 0;

        while (i < owe.length && j < owed.length) {
            const oweAmount = owe[i].amount;
            const owedAmount = owed[j].amount;

            // Determine how much is transferred between them
            const transactionAmount = Math.min(oweAmount, owedAmount);
            if (transactionAmount > 0.1) {
                transactions.push({
                    from: owe[i].memberId,
                    to: owed[j].memberId,
                    amount: round(transactionAmount)
                });
            }
            // Adjust the amounts
            owe[i].amount = round(owe[i].amount - transactionAmount);
            owed[j].amount = round(owed[j].amount - transactionAmount);


            if (owe[i].amount === 0) i++;
            if (owed[j].amount === 0) j++;
        }

        return transactions;
    };
    const [totalDebt, setTotalDebt] = useState(null);
    const [simplifiedTransactions, setSimplifiedTransactions] = useState(null);
    const getMemberName = (memberId) => {
        if (memberId == userId) return "You"
        const member = group.members.find(m => m._id === memberId);
        return member ? member.name : "Unknown";
    };
    const userDebts = simplifiedTransactions?.filter(t => t.from === userId) || [];

    const groupedDebts = userDebts.reduce((acc, curr) => {
        if (!acc[curr.to]) acc[curr.to] = 0;
        acc[curr.to] += curr.amount;
        return acc;
    }, {});

    useEffect(() => {
        if (group && group?.members && groupExpenses?.length > 0) {
            setTotalDebt(calculateDebt(groupExpenses, group.members)); // Always recalculate
        }
    }, [group, groupExpenses]);

    useEffect(() => {
        if (totalDebt) {
            setSimplifiedTransactions(simplifyDebts(totalDebt, group.members));
        }
    }, [totalDebt])
    useEffect(() => {
        fetchGroup();
        fetchGroupExpenses();
    }, [id]);
    const round = (val) => Math.round(val * 100) / 100;

    return (
        <MainLayout groupId={id}>
            <div className="h-full bg-[#121212] text-[#EBF1D5] flex flex-col">
                <div className="bg-[#121212] sticky -top-[5px] z-10 pb-2 border-b border-[#EBF1D5] flex flex-row justify-between">
                    <div className="flex flex-row gap-2">
                        <button onClick={() => navigate(`/groups`)}>
                            <ChevronLeft />
                        </button>
                        <h1 className={`${group?.name ? 'text-[#EBF1D5]' : 'text-[#121212]'} text-3xl font-bold capitalize`}>{group?.name ? group?.name : "Loading"}</h1>
                    </div>
                    {group && <div className="flex flex-col items-end">
                        <div className="flex flex-row items-end">
                            <button
                                className="flex flex-col items-center justify-center z-10 w-8 h-8 rounded-full shadow-md text-2xl"
                                onClick={() => {
                                    const message = `You're invited to join my group on SplitFree! 🎉
Use this code to join: ${group.code}

Or simply tap the link below to log in and join instantly:
${import.meta.env.VITE_FRONTEND_URL}/groups/join/${group.code}`;
                                    const message1 = `Use this code: ${group.code}

Or just click the link below to join directly:
${import.meta.env.VITE_FRONTEND_URL}/groups/join/${group.code}`;

                                    if (navigator.share) {
                                        navigator
                                            .share({
                                                title: "Join my group on SplitFree",
                                                text: message1,
                                                url: `${import.meta.env.VITE_FRONTEND_URL}/groups/join/${group.code}`,
                                            })
                                            .catch((err) => console.error("Sharing failed", err));
                                    } else {
                                        navigator.clipboard.writeText(message);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000); // hide after 2 seconds
                                    }
                                }}
                            >
                                <Share2 strokeWidth={2} size={20} />
                            </button>
                            <button
                                className="flex flex-col items-center justify-center z-10 w-8 h-8 rounded-full shadow-md text-2xl"
                                onClick={() => { navigate(`/groups/settings/${group._id}`) }} >
                                <Settings strokeWidth={2} size={20} />
                            </button>


                        </div>
                        {copied && (
                            <p className="text-gray-500 text-[9px] font-semibold transition-opacity">
                                Copied to clipboard!
                            </p>
                        )}
                    </div>}
                </div>
                <div className="flex flex-col flex-1 w-full overflow-y-auto pt-3 no-scrollbar gap-3">

                    {loading ? (
                        <div className="flex flex-col justify-center items-center flex-1 py-5">
                            <Loader />
                        </div>
                    ) : !group ? (
                        <p>Group not found</p>
                    ) : (
                        <div className="flex flex-col gap-y-3 gap-x-4">

                            {/* Toggle Button */}
                            <div className="flex flex-col gap-2">
                                {/* Header Row */}
                                <div className="flex justify-between items-center">
                                    <p className="text-[14px] text-teal-500 uppercase">Members</p>
                                    <button
                                        onClick={() => setShowMembers((prev) => !prev)}
                                        className="text-sm rounded-full uppercase text-teal-500"
                                    >
                                        {showMembers ? <Eye /> : <EyeClosed />}
                                    </button>
                                </div>

                                {/* Members (collapsible) */}
                                {showMembers && (
                                    <div className="flex flex-wrap gap-2">
                                        {group.members.map((member) => (
                                            <button
                                                key={member._id}
                                                onClick={() =>
                                                    selectedMember === member._id
                                                        ? setSelectedMember(null)
                                                        : setSelectedMember(member._id)
                                                }
                                                className={`px-3 py-1 rounded-full font-semibold border text-sm capitalize transition ${selectedMember === member._id
                                                    ? 'bg-teal-300 border-teal-300 text-black'
                                                    : 'text-[#EBF1D5] border-[#EBF1D5]'
                                                    }`}
                                            >
                                                {member.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <hr />

                            {/* Debt Summary */}
                            {groupExpenses && groupExpenses.length > 0 && <> <div className="flex flex-col">
                                <div className="flex justify-between items-center">
                                    <p className="text-[14px] text-teal-500 uppercase">Debt Summary</p>
                                    <button
                                        onClick={() => setShowSettleModal(true)}
                                        className="text-sm border border-teal-500 rounded-md px-2 py-0.5 uppercase text-teal-500"
                                    >
                                        Settle
                                    </button>
                                </div>
                                {simplifiedTransactions?.map((transaction, index) => {
                                    const name1 = getMemberName(transaction.from);
                                    const name2 = getMemberName(transaction.to);
                                    const amt = transaction.amount.toFixed(2);

                                    const isYouPaying = name1 === "You";
                                    const isYouReceiving = name2 === "You";
                                    const isYou = name1 === "You" || name2 === "You";
                                    const amountColor = isYouPaying
                                        ? "text-red-500"
                                        : isYouReceiving
                                            ? "text-green-500"
                                            : ""; // or leave blank for no color
                                    const textColor = isYou ? "" : "text-[#81827C]"
                                    return (
                                        <div key={index} className={textColor}>
                                            {`${name1} ${isYouPaying ? "owe" : "owes"} ${name2} `}
                                            <span className={amountColor}>₹{amt}</span>
                                        </div>
                                    );
                                })}

                            </div>

                                <hr /></>}

                            {/* Expenses */}
                            <div className="flex flex-col">
                                <div className="flex flex-row justify-between">
                                    <p className="text-[14px]
                                          text-teal-500 uppercase">Expenses</p>
                                    <button
                                        className="flex flex-col items-center justify-center z-10 w-8 h-8 rounded-full shadow-md text-2xl"
                                        onClick={() => navigate('/add-expense', { state: { groupId: id } })}>
                                        <Plus className="text-teal-500" size={20} />
                                    </button>
                                </div>
                                <ul className="flex flex-col w-full gap-2">
                                    {filteredExpenses?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                        .map((exp) => (
                                            <React.Fragment key={exp._id}>

                                                {exp.typeOf != 'settle' ?
                                                    <div key={exp._id} onClick={() => setShowModal(exp)} className="flex flex-row w-full items-center gap-3 min-h-[50px]">
                                                        <div className="flex flex-col justify-center items-center">
                                                            <p className="text-[14px] uppercase">
                                                                {(new Date(exp.createdAt)).toLocaleString('default', { month: 'short' })}
                                                            </p>
                                                            <p className="text-[22px] -mt-[6px]">
                                                                {(new Date(exp.createdAt)).getDate().toString().padStart(2, '0')}
                                                            </p>
                                                        </div>
                                                        <div className="w-[2px] my-[2px] bg-[#EBF1D5] opacity-50 self-stretch"></div>
                                                        <div className="flex grow flex-row justify-between items-center gap-4 min-w-0">
                                                            {/* Left: Description and payer info */}
                                                            <div className="flex flex-col justify-center min-w-0">
                                                                <p className="text-[22px] capitalize truncate">{exp.description}</p>
                                                                <p className="text-[14px] text-[#81827C] capitalize -mt-[6px]">
                                                                    {getPayerInfo(exp.splits)} {getPayerInfo(exp.splits) !== "You were not involved" && `₹${exp.amount.toFixed(2)}`}
                                                                </p>
                                                            </div>

                                                            {/* Right: Owe info */}
                                                            <div className="flex flex-col justify-center items-end text-right shrink-0">
                                                                <p className="text-[13px] whitespace-nowrap">{getOweInfo(exp.splits)?.text}</p>
                                                                <p className="text-[22px] capitalize -mt-[6px] whitespace-nowrap">{getOweInfo(exp.splits)?.amount}</p>
                                                            </div>
                                                        </div>

                                                    </div> :
                                                    <div key={exp._id} onClick={() => setShowModal(exp)} className="flex flex-row w-full items-center gap-3 min-h-[20px]">
                                                        <div className="flex flex-col justify-center items-center">
                                                            <p className="text-[14px] uppercase">
                                                                {(new Date(exp.createdAt)).toLocaleString('default', { month: 'short' })}
                                                            </p>
                                                            <p className="text-[22px] -mt-[6px]">
                                                                {(new Date(exp.createdAt)).getDate().toString().padStart(2, '0')}
                                                            </p>
                                                        </div>
                                                        <div className="w-[2px] my-[2px] bg-[#EBF1D5] opacity-50 self-stretch"></div>
                                                        <div className="flex grow flex-row justify-between items-center gap-4 min-w-0">
                                                            {/* Left: Description and payer info */}
                                                            <div className="flex flex-col justify-center min-w-0">
                                                                <p className="text-[14px] text-[#81827C] capitalize">
                                                                    {getSettleDirectionText(exp.splits)} {`₹${exp.amount.toFixed(2)}`}
                                                                </p>
                                                            </div>
                                                        </div>

                                                    </div>
                                                }
                                            </React.Fragment>

                                        ))}
                                </ul>
                            </div>

                        </div>
                    )}
                </div>
            </div>


            {showModal && (
                <ExpenseModal showModal={showModal} fetchExpenses={fetchGroupExpenses} setShowModal={setShowModal} userToken={userToken} />
            )}
            {showSettleModal && (
                <SettleModal
                    setShowModal={setShowSettleModal}
                    group={group}
                    simplifiedTransactions={simplifiedTransactions}
                    onSubmit={handleSettle}
                    userId={userId}
                />

            )}


        </MainLayout>
    );
};

export default GroupDetails;
