import { buildApiUrl } from "../config/api";

export interface InviteStats {
  totalInvited: number;
  rewarded: number;
  pending: number;
  totalRewardedWords: number;
}

export interface InviteInfo {
  inviteCode: string;
  inviteLink: string;
  stats: InviteStats;
  recentRecords: any[];
}

export interface QRCodeData {
  qrCodeDataUrl: string;
  inviteLink: string;
}

export async function getInviteInfo(): Promise<InviteInfo> {
  const response = await fetch(buildApiUrl("/api/invite/info"), {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("获取邀请信息失败");
  }

  return response.json();
}

export async function getQRCode(): Promise<QRCodeData> {
  const response = await fetch(buildApiUrl("/api/invite/qrcode"), {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("获取二维码失败");
  }

  return response.json();
}

export async function getInviteStats(): Promise<InviteStats> {
  const response = await fetch(buildApiUrl("/api/invite/stats"), {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("获取邀请统计失败");
  }

  return response.json();
}

export async function grantReward(recordId: string): Promise<void> {
  const response = await fetch(buildApiUrl("/api/invite/grant-reward"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ recordId }),
  });

  if (!response.ok) {
    throw new Error("发放奖励失败");
  }

  return response.json();
}
