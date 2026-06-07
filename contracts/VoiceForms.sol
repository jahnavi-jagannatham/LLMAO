// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VoiceForms {
    struct Profile {
        string name;
        string college;
        string degree;
        string skills;
        string location;
        string experience;
        bool exists;
    }

    struct VerificationRecord {
        string formId;
        string submissionHash;
        uint256 timestamp;
        address walletAddress;
        bool exists;
    }

    // Mapping from wallet address to user profile
    mapping(address => Profile) public profiles;

    // Mapping from submission hash (SHA256 hex string) to verification record
    mapping(string => VerificationRecord) public verifications;

    // Events
    event ProfileUpdated(
        address indexed walletAddress,
        string name,
        string college,
        string degree
    );

    event VerificationSubmitted(
        string indexed formId,
        string indexed submissionHash,
        uint256 timestamp,
        address indexed walletAddress
    );

    // Save or update user profile
    function saveProfile(
        string memory _name,
        string memory _college,
        string memory _degree,
        string memory _skills,
        string memory _location,
        string memory _experience
    ) public {
        profiles[msg.sender] = Profile({
            name: _name,
            college: _college,
            degree: _degree,
            skills: _skills,
            location: _location,
            experience: _experience,
            exists: true
        });

        emit ProfileUpdated(msg.sender, _name, _college, _degree);
    }

    // Retrieve user profile
    function getProfile(address _user) public view returns (Profile memory) {
        return profiles[_user];
    }

    // Submit a canonical form submission hash for verification
    function submitVerification(
        string memory _formId,
        string memory _submissionHash
    ) public {
        require(bytes(_submissionHash).length > 0, "Submission hash cannot be empty");
        
        verifications[_submissionHash] = VerificationRecord({
            formId: _formId,
            submissionHash: _submissionHash,
            timestamp: block.timestamp,
            walletAddress: msg.sender,
            exists: true
        });

        emit VerificationSubmitted(_formId, _submissionHash, block.timestamp, msg.sender);
    }

    // Retrieve verification record
    function getVerification(string memory _submissionHash) public view returns (VerificationRecord memory) {
        return verifications[_submissionHash];
    }
}
