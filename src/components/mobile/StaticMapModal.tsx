'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import data from '@/data/content.json';

interface StaticMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * StaticMapModal: 移动端静态地图入口
 * 仅供地理参考，支持 Pin 点展示
 */
export function StaticMapModal({ isOpen, onClose }: StaticMapModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="relative w-full max-w-lg aspect-[3/4] bg-[#fdfbf7] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-lg font-serif text-stone-800 tracking-wider">校园时光地图</h2>
                <p className="text-[9px] text-stone-400 uppercase tracking-widest">Static Reference Map</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-stone-100"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative overflow-auto bg-[#f8f5f0]">
              <div className="relative min-w-[600px] h-full flex items-center justify-center p-4">
                <div className="relative w-full aspect-[4/3]">
                  <Image
                    src="/images/map.svg"
                    alt="HNU Map"
                    fill
                    className="object-contain"
                    priority
                  />
                  
                  {data.locations.map((loc) => {
                    const latestStory = loc.stories[0];
                    if (!latestStory) return null;

                    return (
                      <div
                        key={loc.id}
                        className="absolute"
                        style={{
                          left: `${loc.x}%`,
                          top: `${loc.y}%`,
                          transform: 'translate(-50%, -50%)' 
                        }}
                      >
                        <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white">
                          <Image 
                            src={latestStory.avatarUrl} 
                            alt={latestStory.characterName} 
                            width={32} 
                            height={32} 
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white text-center border-t border-stone-100">
              <p className="text-[10px] text-stone-400 font-serif tracking-widest uppercase italic">
                "在这里，寻回那些散落的时光"
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
