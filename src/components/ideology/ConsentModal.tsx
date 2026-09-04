"use client";

import { useEffect, useState } from "react";
import { setUploadConsent } from "@/lib/ideology-store";

const NOTICE_KEY = "thinkcode.data-notice-acknowledged";

const NOTICE_POINTS = [
  "你的学习记录（顿悟选择、模块浏览）只保存在本机浏览器中，平台不收集任何个人身份信息。",
  "点「知道了」即视为同意匿名回传（仅模块编号与选项编号，无任何身份信息），之后可在「思想成长」页随时取消勾选。",
  "平台无任何第三方追踪、广告或行为遥测脚本。",
];

export function ConsentModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(NOTICE_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleAcknowledge = () => {
    window.localStorage.setItem(NOTICE_KEY, "1");
    setUploadConsent(true);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-bold">数据使用说明</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          继续使用前，请花 10 秒钟了解本平台如何处理数据：
        </p>
        <ul className="mt-4 space-y-2.5">
          {NOTICE_POINTS.map((point, index) => (
            <li key={index} className="flex gap-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              {point}
            </li>
          ))}
        </ul>
        <button
          onClick={handleAcknowledge}
          className="mt-6 w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          知道了
        </button>
        <p className="mt-3 text-center text-[10px] text-zinc-400">
          完整说明见「参与研究」页；本提示仅在你首次访问时显示一次。
        </p>
      </div>
    </div>
  );
}
