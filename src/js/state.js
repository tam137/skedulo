export const state = {
    currentUserId: parseInt(document.body.dataset.userId || "0", 10),
    userList: [],
    cachedAppointments: [],
    cachedPastAppointments: [],
    currentEmojiFilter: 'all',
    appointmentSharingSelect: null,
    fileSharingSelect: null,
    editFileSharingSelect: null,
    currentDeleteId: null,
    adminActionType: null,
    currentAdminActionUserId: null
};
