export class Util {
    static visvalingamWhyatt(data: { x: number; y: number }[], threshold: number) {
        data = data.filter((point) => Date.now() - point.x < 1000 * 60 * 5);
        if (data.length <= threshold) return data;

        const getArea = (p1: { x: any; y: any; }, p2: { x: any; y: any; }, p3: {
            x: any;
            y: any;
        }) => Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);

        const areas = data.map((point, i) => {
            if (i === 0 || i === data.length - 1) return Infinity;
            return getArea(data[i - 1], point, data[i + 1]);
        });

        const sortedIndices = areas
            .map((area, i) => ({area, index: i}))
            .sort((a, b) => b.area - a.area)
            .slice(0, threshold)
            .map(p => p.index)
            .sort((a, b) => a - b);

        return sortedIndices.map(index => data[index]);
    }
}