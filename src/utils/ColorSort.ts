import colorUtil from '../utils/color-util.min';

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface ColorCluster {
  name: string;
  leadColor: number[];
  colors: colorUtil.Color[];
}

export default class ColorSort {
  private clusters: ColorCluster[];

  constructor() {
    this.clusters = [
      { name: 'red', leadColor: [255, 0, 0], colors: [] },
      { name: 'orange', leadColor: [255, 128, 0], colors: [] },
      { name: 'yellow', leadColor: [255, 255, 0], colors: [] },
      { name: 'chartreuse', leadColor: [128, 255, 0], colors: [] },
      { name: 'green', leadColor: [0, 255, 0], colors: [] },
      { name: 'spring green', leadColor: [0, 255, 128], colors: [] },
      { name: 'cyan', leadColor: [0, 255, 255], colors: [] },
      { name: 'azure', leadColor: [0, 127, 255], colors: [] },
      { name: 'blue', leadColor: [0, 0, 255], colors: [] },
      { name: 'violet', leadColor: [127, 0, 255], colors: [] },
      { name: 'magenta', leadColor: [255, 0, 255], colors: [] },
      { name: 'rose', leadColor: [255, 0, 128], colors: [] },
      { name: 'black', leadColor: [0, 0, 0], colors: [] },
      { name: 'grey', leadColor: [235, 235, 235], colors: [] },
      { name: 'white', leadColor: [255, 255, 255], colors: [] },
    ];
  }

  private blendRgbaWithWhite(rgba: string): string {
    const color = colorUtil.color(rgba);
    const a = color.rgb.a / 255;
    const r = Math.floor(color.rgb.r * a + 0xff * (1 - a));
    const g = Math.floor(color.rgb.g * a + 0xff * (1 - a));
    const b = Math.floor(color.rgb.b * a + 0xff * (1 - a));
    return `#${((r << 16) | (g << 8) | b).toString(16)}`;
  }

  private colorDistance(color1: number[], color2: number[]): number {
    const x = Math.pow(color1[0] - color2[0], 2) + Math.pow(color1[1] - color2[1], 2) + Math.pow(color1[2] - color2[2], 2);
    return Math.sqrt(x);
  }

  private oneDimensionSorting(colors: colorUtil.Color[], dim: 's' | 'l'): colorUtil.Color[] {
    return colors.sort((colorA, colorB) => {
      if (colorA.hsl[dim] < colorB.hsl[dim]) {
        return -1;
      } else if (colorA.hsl[dim] > colorB.hsl[dim]) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  private sortWithClusters(colorsToSort: string[]): ColorCluster[] {
    const mappedColors = colorsToSort
      .map((color) => {
        const isRgba = color.includes('rgba');
        if (isRgba) {
          return this.blendRgbaWithWhite(color);
        } else {
          return color;
        }
      })
      .map(colorUtil.color);

    mappedColors.forEach((color: any) => {
      let minDistance: number | undefined;
      let minDistanceClusterIndex: number | undefined;

      this.clusters.forEach((cluster, clusterIndex) => {
        const colorRgbArr = [color.rgb.r, color.rgb.g, color.rgb.b];
        const distance = this.colorDistance(colorRgbArr, cluster.leadColor);
        if (typeof minDistance === 'undefined' || minDistance > distance) {
          minDistance = distance;
          minDistanceClusterIndex = clusterIndex;
        }
      });

      if (minDistanceClusterIndex !== undefined) {
        this.clusters[minDistanceClusterIndex].colors.push(color);
      }
    });

    this.clusters.forEach((cluster) => {
      const dim = ['white', 'grey', 'black'].includes(cluster.name) ? 'l' : 's';
      cluster.colors = this.oneDimensionSorting(cluster.colors, dim);
    });

    return this.clusters;
  }

  sort(colors: string[]): string[] {
    const sortedClusters = this.sortWithClusters(colors);
    const sortedColors = sortedClusters.reduce((acc, curr) => {
      const colors = curr.colors.map((color) => color.hex);
      return [...acc, ...colors];
    }, []);
    return sortedColors;
  }
}
