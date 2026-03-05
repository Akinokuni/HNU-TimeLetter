'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import data from '@/data/content.json';

/**
 * QuillSearch (羽毛笔搜索组件)
 *
 * 状态机: idle → letter → writing → result → idle
 *
 * - idle: 右下角显示笔墨贴图
 * - letter: 展开信纸，显示搜索输入框
 * - writing: 书写动画 (0.5s)
 * - result: 结果展示 (找到 → 回调跳转 / 未找到 → 显示提示文字)
 */

type SearchPhase = 'idle' | 'letter' | 'writing' | 'result';

interface QuillSearchProps {
    onSearchResult: (locationId: string) => void;
}

/** 从数据中提取所有角色名及其 locationId */
function buildCharacterIndex(): { name: string; locationId: string }[] {
    const seen = new Set<string>();
    const result: { name: string; locationId: string }[] = [];
    for (const loc of data.locations) {
        for (const story of loc.stories) {
            const key = `${story.characterName}@${loc.id}`;
            if (!seen.has(key)) {
                seen.add(key);
                result.push({ name: story.characterName, locationId: loc.id });
            }
        }
    }
    return result;
}

export function QuillSearch({ onSearchResult }: QuillSearchProps) {
    const [phase, setPhase] = useState<SearchPhase>('idle');
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [foundLocationId, setFoundLocationId] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const characterIndex = useMemo(() => buildCharacterIndex(), []);

    // 模糊过滤建议
    const suggestions = useMemo(() => {
        if (!inputValue.trim()) return [];
        return characterIndex.filter((c) =>
            c.name.toLowerCase().includes(inputValue.trim().toLowerCase())
        );
    }, [inputValue, characterIndex]);

    // 点击贴图 → 展开信纸
    const handleQuillClick = useCallback(() => {
        if (phase !== 'idle') return;
        setPhase('letter');
        setInputValue('');
        setNotFound(false);
        setFoundLocationId(null);
    }, [phase]);

    // 聚焦输入框
    useEffect(() => {
        if (phase === 'letter') {
            const timer = setTimeout(() => inputRef.current?.focus(), 600);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // 提交搜索
    const handleSubmit = useCallback((overrideName?: string) => {
        // overrideName is either passed from suggestion click or string
        const finalName = typeof overrideName === 'string' ? overrideName : inputValue;
        const query = finalName.trim();
        if (!query || phase !== 'letter') return;

        setShowSuggestions(false);
        if (typeof overrideName === 'string') {
            setInputValue(overrideName);
        }
        setPhase('writing');

        // 0.5s 书写动画后进入 result
        setTimeout(() => {
            const match = characterIndex.find((c) =>
                c.name.toLowerCase().includes(query.toLowerCase())
            );
            if (match) {
                setFoundLocationId(match.locationId);
                setNotFound(false);
            } else {
                setFoundLocationId(null);
                setNotFound(true);
            }
            setPhase('result');
        }, 500);
    }, [inputValue, phase, characterIndex]);

    // result 阶段 — 找到角色时延迟后执行跳转
    useEffect(() => {
        if (phase === 'result' && foundLocationId) {
            const timer = setTimeout(() => {
                onSearchResult(foundLocationId);
                // 重置
                setPhase('idle');
                setInputValue('');
                setFoundLocationId(null);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [phase, foundLocationId, onSearchResult]);

    // result 阶段 — 未找到角色时，字显结束（1.1s）后延时0.5s执行退出（即 1.6s）
    useEffect(() => {
        if (phase === 'result' && notFound) {
            const timer = setTimeout(() => {
                setPhase('idle');
                setInputValue('');
                setNotFound(false);
            }, 1600);
            return () => clearTimeout(timer);
        }
    }, [phase, notFound]);

    // 选中建议，直接提交
    const handleSelectSuggestion = useCallback((name: string) => {
        handleSubmit(name);
    }, [handleSubmit]);

    // 点击墨水瓶 → 回到 idle
    const handleInkClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setPhase('idle');
        setInputValue('');
        setNotFound(false);
        setFoundLocationId(null);
    }, []);

    const isOpen = phase !== 'idle';

    return (
        <div
            className="absolute bottom-6 right-6 z-40 select-none"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* ── 笔墨贴图 (idle 状态) ─────────────────────────────── */}
            <AnimatePresence>
                {phase === 'idle' && (
                    <motion.button
                        key="quill-idle"
                        className="relative cursor-pointer hover:scale-110 transition-transform duration-300 flex items-end justify-center"
                        style={{ width: 180, height: 180 }}
                        onClick={handleQuillClick}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        aria-label="搜索角色"
                        title="点击搜索角色"
                    >
                        {/* 笔 */}
                        <div className="absolute top-0 right-6 w-24 h-40 transform rotate-12 origin-bottom">
                            <Image
                                src="/images/pen.png"
                                alt="羽毛笔"
                                fill
                                className="object-contain drop-shadow-md"
                                sizes="96px"
                                unoptimized
                            />
                        </div>
                        {/* 墨水瓶 */}
                        <div className="absolute bottom-0 left-4 w-24 h-24">
                            <Image
                                src="/images/ink.png"
                                alt="墨水瓶"
                                fill
                                className="object-contain drop-shadow-lg"
                                sizes="96px"
                                unoptimized
                            />
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── 信纸 + 笔交互 ─────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="letter-panel"
                        className="absolute bottom-0 right-0 flex items-end gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* 信纸 */}
                        <motion.div
                            className="relative bg-[#fdfbf3] rounded-sm shadow-xl border border-[#e8dcc8] overflow-hidden"
                            style={{ width: 340, transformOrigin: 'bottom center' }}
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 1 }}
                            exit={{
                                opacity: 0,
                                filter: 'blur(8px)',
                                scale: 1.05,
                            }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {/* 信纸内容 */}
                            <div className="px-7 pt-7 pb-5">
                                {/* 上方留白 + 标题 */}
                                <p
                                    className="text-center text-sm text-[#8b5a2b] mb-5 tracking-widest"
                                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                                >
                                    你想要寻找的「她」是？
                                </p>

                                {/* 四条横线 + 输入框 */}
                                <div className="relative">
                                    {/* 横线 */}
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="w-full h-px bg-[#292524] opacity-25"
                                            style={{ marginBottom: i < 3 ? 28 : 0 }}
                                        />
                                    ))}

                                    {/* 输入框 (覆盖在第一条线与第二条线之间) */}
                                    <div className="absolute left-0 right-0" style={{ top: 4 }}>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSubmit();
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            placeholder="请输入角色名..."
                                            className="w-full bg-transparent border-none outline-none text-[#292524] text-base tracking-wide placeholder:text-[#b8a898]"
                                            style={{
                                                fontFamily: "'Noto Serif SC', serif",
                                                caretColor: '#8b5a2b',
                                            }}
                                            disabled={phase !== 'letter'}
                                        />

                                        {/* 下拉建议 */}
                                        <AnimatePresence>
                                            {showSuggestions && suggestions.length > 0 && phase === 'letter' && (
                                                <motion.ul
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute left-0 right-0 top-8 bg-white/95 backdrop-blur-sm border border-[#e8dcc8] rounded shadow-lg z-50 max-h-32 overflow-y-auto"
                                                >
                                                    {suggestions.map((s, i) => (
                                                        <li
                                                            key={`${s.name}-${s.locationId}-${i}`}
                                                            className="px-3 py-2 text-sm text-[#292524] hover:bg-[#f5efe5] cursor-pointer transition-colors"
                                                            style={{ fontFamily: "'Noto Serif SC', serif" }}
                                                            onClick={() => handleSelectSuggestion(s.name)}
                                                        >
                                                            {s.name}
                                                        </li>
                                                    ))}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* 书写动画指示 */}
                                <AnimatePresence>
                                    {phase === 'writing' && (
                                        <motion.div
                                            className="mt-4 text-center text-xs text-[#8b5a2b] italic"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 1, 0.5, 1] }}
                                            transition={{ duration: 0.5, repeat: 0 }}
                                        >
                                            正在书写「魔法书」中
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* 未找到结果提示 (底部两行) */}
                                <AnimatePresence>
                                    {phase === 'result' && notFound && (
                                        <div className="mt-3">
                                            <motion.p
                                                className="text-center text-sm text-[#8b5a2b] tracking-wide"
                                                style={{ fontFamily: "'Noto Serif SC', serif" }}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: 0.1 }}
                                            >
                                                您所寻找的「她」似乎并未来到这里
                                            </motion.p>
                                            <motion.p
                                                className="text-center text-sm text-[#a0896e] mt-2 tracking-wide"
                                                style={{ fontFamily: "'Noto Serif SC', serif" }}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: 0.6 }}
                                            >
                                                敬请期待以后的邂逅
                                            </motion.p>
                                        </div>
                                    )}
                                </AnimatePresence>

                                {/* 找到结果 — 化开动画 */}
                                <AnimatePresence>
                                    {phase === 'result' && foundLocationId && (
                                        <motion.p
                                            className="mt-3 text-center text-sm text-[#4a8b5a] tracking-wide"
                                            style={{ fontFamily: "'Noto Serif SC', serif" }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            寻迹而去...
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* 笔 (信纸右侧) */}
                        <motion.div
                            className="relative flex-shrink-0"
                            style={{ width: 96, height: 168 }}
                            initial={{ x: 20, y: 10, rotate: 15 }}
                            animate={
                                phase === 'writing'
                                    ? {
                                        x: [-240, -200, -160, -120, -80, -40, -10, 0],
                                        y: [-110, -125, -110, -125, -110, -125, -110, 10],
                                        rotate: [5, 0, 10, 0, 10, 0, 10, 5],
                                    }
                                    : { x: 0, y: 10, rotate: 5 }
                            }
                            transition={
                                phase === 'writing'
                                    ? { duration: 0.5, ease: 'easeInOut' }
                                    : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                            }
                        >
                            <div className="relative w-full h-full drop-shadow-md">
                                <Image
                                    src="/images/pen.png"
                                    alt="羽毛笔"
                                    fill
                                    className="object-contain"
                                    sizes="96px"
                                    unoptimized
                                />
                            </div>
                        </motion.div>

                        {/* 墨水瓶按钮 (点击回到 idle) */}
                        <motion.button
                            className="relative flex-shrink-0 cursor-pointer hover:scale-110 transition-transform flex items-end"
                            style={{ width: 96, height: 96, marginBottom: -4, marginLeft: -16 }}
                            onClick={handleInkClick}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.3 }}
                            aria-label="收起搜索"
                            title="点击收起搜索"
                        >
                            <div className="relative w-full h-full drop-shadow-md">
                                <Image
                                    src="/images/ink.png"
                                    alt="墨水瓶"
                                    fill
                                    className="object-contain"
                                    sizes="96px"
                                    unoptimized
                                />
                            </div>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
