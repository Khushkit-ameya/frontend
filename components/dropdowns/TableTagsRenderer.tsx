import React from 'react';

interface Tag {
  value: string;
  label?: string;
  color?: string;
}

interface TableTagsRendererProps {
  tags: string | Tag | Tag[] | unknown;
  maxWidth?: string;
}

export const TableTagsRenderer: React.FC<TableTagsRendererProps> = ({ 
  tags,
  maxWidth = '300px'
}) => {
  const normalizedTags = React.useMemo((): Tag[] => {
    if (!tags) return [];
    
    if (Array.isArray(tags)) {
      return tags.map(tag => {
        if (typeof tag === 'string') {
          return { value: tag, label: tag };
        }
        if (typeof tag === 'object' && tag !== null && 'value' in tag) {
          return tag as Tag;
        }
        return { value: String(tag), label: String(tag) };
      });
    }
    
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            value: String(typeof item === 'object' ? item.value || item : item),
            label: String(typeof item === 'object' ? item.label || item.value || item : item)
          }));
        }
        return [{ value: parsed, label: parsed }];
      } catch {
        return [{ value: tags, label: tags }];
      }
    }
    
    if (typeof tags === 'object' && tags !== null) {
      const tagObject = tags as Record<string, unknown>;
      if ('value' in tagObject) {
        return [{
          value: String(tagObject.value),
          label: String(tagObject.label || tagObject.value),
          color: typeof tagObject.color === 'string' ? tagObject.color : undefined
        }];
      }
      return [{ value: JSON.stringify(tags), label: JSON.stringify(tags) }];
    }
    
    return [{ value: String(tags), label: String(tags) }];
  }, [tags]);

  if (normalizedTags.length === 0) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  return (
    <div 
      className="flex items-center gap-1.5 overflow-x-auto py-0"
      style={{ 
        maxWidth,
        scrollbarWidth: 'thin',
        scrollbarColor: '#CBD5E0 transparent'
      }}
    >
      <div className="flex items-center gap-1.5 flex-nowrap py-0">
        {normalizedTags.map((tag: Tag, index: number) => (
          <div
            key={index}
            className="flex items-center gap-1.5 px-2 py-0 rounded-full text-xs bg-gray-200 border border-gray-300 flex-shrink-0 leading-none"
            style={tag.color ? { 
              backgroundColor: `${tag.color}20`,
              borderColor: tag.color,
              color: tag.color
            } : undefined}
          >
            <span className="font-medium whitespace-nowrap leading-none">{tag.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};