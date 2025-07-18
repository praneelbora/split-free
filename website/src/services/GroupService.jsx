
// groupService.js

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const getGroupDetails = async (groupId, userToken) => {
    const response = await fetch(`${BASE_URL}/v1/groups/${groupId}`, {
        headers: {
            "Content-Type": "application/json",
            "x-auth-token": userToken,
        },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to get group details");
    return data;
};

export const updateGroupName = async (groupId, name, userToken) => {
    const response = await fetch(`${BASE_URL}/v1/groups/${groupId}/name`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "x-auth-token": userToken,
        },
        body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update group name");
    return data;
};

export const leaveGroup = async (groupId, userToken) => {
    const response = await fetch(`${BASE_URL}/v1/groups/${groupId}/leave`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth-token": userToken,
        },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to leave group");
    return data;
};

export const deleteGroup = async (groupId, userToken) => {
    const response = await fetch(`${BASE_URL}/v1/groups/${groupId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "x-auth-token": userToken,
        },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete group");
    return data;
};

export const removeMember = async (groupId, memberId, userToken) => {
    const response = await fetch(`${BASE_URL}/v1/groups/${groupId}/remove`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth-token": userToken,
        },
        body: JSON.stringify({ memberId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to remove member");
    return data;
};

export const promoteMember = async (groupId, memberId, userToken) => {
    const response = await fetch(`${BASE_URL}/v1/groups/${groupId}/promote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth-token": userToken,
        },
        body: JSON.stringify({ memberId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to promote member");
    return data;
};

export const demoteMember = async (groupId, memberId, userToken) => {
    const response = await fetch(`${BASE_URL}/v1/groups/${groupId}/demote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-auth-token": userToken,
        },
        body: JSON.stringify({ memberId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to demote member");
    return data;
};

export const fetchGroupExpenses = async (groupId, userToken) => {
    const response = await fetch(`${BASE_URL}/v1/expenses/groups/${groupId}`, {
        headers: {
            "Content-Type": "application/json",
            "x-auth-token": userToken,
        },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch group expenses");
    return data;
};
