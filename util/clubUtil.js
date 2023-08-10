module.exports.inClub = (club, userID) => {

    
    let isMember = club.members.includes(userID)
    let isOfficer = club.members.includes(userID)
    let isSponsor = club.members.includes(userID)

    return isMember || (isSponsor || isOfficer)

}

module.exports.isRole = (role, club, userID) => {
    return club[`${role}s`].includes(userID)
}
