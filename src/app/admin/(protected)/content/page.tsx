import fs from 'fs';
import path from 'path';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LocationPoint } from '@/lib/types';

export default async function ContentPage() {
  const contentPath = path.resolve(process.cwd(), 'src/data/content.json');
  let data: { locations: LocationPoint[] } = { locations: [] };
  
  try {
    const fileContent = fs.readFileSync(contentPath, 'utf-8');
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading content.json', error);
  }

  return (
    <div className="space-y-6">
      <h2 className="mb-0 text-2xl font-bold">内容数据查看</h2>
      <p className="text-gray-500">共 {data.locations.length} 个地点</p>
      
      <div className="grid gap-6">
        {data.locations.map((loc) => (
          <div key={loc.id} className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-semibold">{loc.name} <span className="text-sm text-gray-400">({loc.id})</span></h3>
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">坐标: {loc.x}%, {loc.y}%</span>
            </div>
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {loc.stories.map((story) => (
                  <div key={story.id} className="flex gap-4 p-3 bg-gray-50 rounded hover:bg-gray-100">
                     <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {story.avatarUrl && <img src={story.avatarUrl} alt={story.characterName} className="w-full h-full object-cover" />}
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between">
                           <span className="font-bold">{story.characterName}</span>
                           <span className="text-xs text-gray-500">{story.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">{story.content}</p>
                        <div className="mt-2 text-xs text-gray-400">
                           作者: {story.author} | ID: {story.id}
                        </div>
                     </div>
                  </div>
                ))}
                {loc.stories.length === 0 && <p className="text-gray-400 text-center py-4">暂无故事</p>}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  );
}
