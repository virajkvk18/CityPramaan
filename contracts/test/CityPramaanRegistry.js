const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CityPramaanRegistry", function () {
  async function deployRegistry() {
    const [owner, citizen, contractor, wardAdmin, outsider] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CityPramaanRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    return { registry, owner, citizen, contractor, wardAdmin, outsider };
  }

  it("lets citizens create unique report proof records", async function () {
    const { registry, citizen } = await deployRegistry();
    const publicId = "CP-TEST-001";
    const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report proof"));

    await expect(registry.connect(citizen).createReport(publicId, reportHash))
      .to.emit(registry, "ReportCreated")
      .withArgs(publicId, reportHash, citizen.address);

    const record = await registry.proofs(publicId);
    expect(record.reportHash).to.equal(reportHash);
    expect(record.status).to.equal(0);

    await expect(registry.connect(citizen).createReport(publicId, reportHash)).to.be.revertedWith(
      "proof exists"
    );
  });

  it("requires a contractor role before repair proof submission", async function () {
    const { registry, owner, citizen, contractor, outsider } = await deployRegistry();
    const publicId = "CP-TEST-002";
    const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report proof"));
    const repairHash = ethers.keccak256(ethers.toUtf8Bytes("repair proof"));

    await registry.connect(citizen).createReport(publicId, reportHash);

    await expect(registry.connect(outsider).submitRepair(publicId, repairHash)).to.be.revertedWith(
      "contractor only"
    );

    await registry.connect(owner).setContractor(contractor.address, true);

    await expect(registry.connect(contractor).submitRepair(publicId, repairHash))
      .to.emit(registry, "RepairSubmitted")
      .withArgs(publicId, repairHash, contractor.address);

    const record = await registry.proofs(publicId);
    expect(record.repairHash).to.equal(repairHash);
    expect(record.status).to.equal(1);
  });

  it("requires a ward admin role before status updates", async function () {
    const { registry, owner, citizen, contractor, wardAdmin, outsider } = await deployRegistry();
    const publicId = "CP-TEST-003";
    const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report proof"));
    const repairHash = ethers.keccak256(ethers.toUtf8Bytes("repair proof"));

    await registry.connect(owner).setContractor(contractor.address, true);
    await registry.connect(owner).setWardAdmin(wardAdmin.address, true);
    await registry.connect(citizen).createReport(publicId, reportHash);
    await registry.connect(contractor).submitRepair(publicId, repairHash);

    await expect(registry.connect(outsider).updateStatus(publicId, 2)).to.be.revertedWith(
      "ward admin only"
    );

    await expect(registry.connect(wardAdmin).updateStatus(publicId, 2))
      .to.emit(registry, "StatusUpdated")
      .withArgs(publicId, 2, wardAdmin.address);

    const record = await registry.proofs(publicId);
    expect(record.status).to.equal(2);
  });

  it("anchors profile hashes and exposes permission flags", async function () {
    const { registry, owner, contractor, wardAdmin } = await deployRegistry();
    const contractorProfileHash = ethers.keccak256(ethers.toUtf8Bytes("contractor profile"));
    const adminProfileHash = ethers.keccak256(ethers.toUtf8Bytes("admin profile"));

    await registry.connect(owner).setContractor(contractor.address, true);
    await registry.connect(owner).setWardAdmin(wardAdmin.address, true);

    await expect(registry.connect(contractor).updateProfile(contractorProfileHash, 2))
      .to.emit(registry, "ProfileUpdated")
      .withArgs(contractor.address, contractorProfileHash, 2);

    await expect(registry.connect(wardAdmin).updateProfile(adminProfileHash, 1))
      .to.emit(registry, "ProfileUpdated")
      .withArgs(wardAdmin.address, adminProfileHash, 1);

    const contractorProfile = await registry.profiles(contractor.address);
    const adminProfile = await registry.profiles(wardAdmin.address);

    expect(contractorProfile.profileHash).to.equal(contractorProfileHash);
    expect(contractorProfile.contractorAllowed).to.equal(true);
    expect(contractorProfile.wardAdminAllowed).to.equal(false);
    expect(adminProfile.profileHash).to.equal(adminProfileHash);
    expect(adminProfile.wardAdminAllowed).to.equal(true);
  });
});
