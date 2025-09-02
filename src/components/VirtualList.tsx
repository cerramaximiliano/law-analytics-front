import React, { memo } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

interface VirtualListProps {
	items: any[];
	itemHeight: number;
	renderItem: (props: { index: number; style: React.CSSProperties; data: any }) => React.ReactElement;
	overscan?: number;
}

// Virtual scrolling para listas de más de 100 items
export const VirtualList = memo(({ items, itemHeight, renderItem, overscan = 5 }: VirtualListProps) => {
	// Solo usar virtual scrolling si hay muchos items
	if (items.length < 100) {
		return <>{items.map((item, index) => renderItem({ index, style: {}, data: item }))}</>;
	}

	return (
		<AutoSizer>
			{({ height, width }: { height: number; width: number }) => (
				<List height={height} itemCount={items.length} itemSize={itemHeight} width={width} overscanCount={overscan} itemData={items}>
					{renderItem}
				</List>
			)}
		</AutoSizer>
	);
});

VirtualList.displayName = "VirtualList";

// Hook para usar con tablas
export const useVirtualTable = (data: any[], rowHeight = 50) => {
	const virtualizer = {
		totalSize: data.length * rowHeight,
		virtualItems: data.map((item, index) => ({
			index,
			start: index * rowHeight,
			size: rowHeight,
			data: item,
		})),
	};

	return virtualizer;
};
