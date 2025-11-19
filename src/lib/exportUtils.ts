import { ExportOptions } from '../components/ExportDialog';

export class ExportUtils {
  static async exportCanvas(
    canvas: HTMLCanvasElement,
    options: ExportOptions
  ): Promise<void> {
    let dataUrl: string;

    if (options.format === 'PDF') {
      await this.exportAsPDF(canvas, options);
      return;
    }

    if (options.colorSpace === 'CMYK') {
      dataUrl = await this.convertToCMYK(canvas, options);
    } else {
      const quality = options.quality / 100;
      const mimeType = options.format === 'JPEG' ? 'image/jpeg' : 'image/png';
      dataUrl = canvas.toDataURL(mimeType, quality);
    }

    this.downloadFile(dataUrl, options.filename, options.format);
  }

  private static async convertToCMYK(
    canvas: HTMLCanvasElement,
    options: ExportOptions
  ): Promise<string> {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      const k = 1 - Math.max(r, g, b);

      let c = 0, m = 0, y = 0;

      if (k < 1) {
        c = (1 - r - k) / (1 - k);
        m = (1 - g - k) / (1 - k);
        y = (1 - b - k) / (1 - k);
      }

      data[i] = Math.round((1 - c) * (1 - k) * 255);
      data[i + 1] = Math.round((1 - m) * (1 - k) * 255);
      data[i + 2] = Math.round((1 - y) * (1 - k) * 255);
    }

    ctx.putImageData(imageData, 0, 0);

    const quality = options.quality / 100;
    const mimeType = options.format === 'JPEG' ? 'image/jpeg' : 'image/png';
    return canvas.toDataURL(mimeType, quality);
  }

  private static async exportAsPDF(
    canvas: HTMLCanvasElement,
    options: ExportOptions
  ): Promise<void> {
    const imgData = canvas.toDataURL('image/jpeg', options.quality / 100);

    const aspectRatio = canvas.width / canvas.height;
    const pdfWidth = 210;
    const pdfHeight = pdfWidth / aspectRatio;

    const pdfContent = this.createSimplePDF(imgData, pdfWidth, pdfHeight);

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    this.downloadFile(url, options.filename, 'PDF');
    URL.revokeObjectURL(url);
  }

  private static createSimplePDF(imgData: string, width: number, height: number): string {
    const base64Data = imgData.split(',')[1];

    const pdf = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${width * 2.83465} ${height * 2.83465}]
/Contents 4 0 R
/Resources <<
/XObject <<
/Im1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
q
${width * 2.83465} 0 0 ${height * 2.83465} 0 0 cm
/Im1 Do
Q
endstream
endobj

5 0 obj
<<
/Type /XObject
/Subtype /Image
/Width ${canvas.width}
/Height ${canvas.height}
/ColorSpace /DeviceRGB
/BitsPerComponent 8
/Filter /DCTDecode
/Length ${base64Data.length}
>>
stream
${atob(base64Data)}
endstream
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000315 00000 n
0000000409 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${650 + base64Data.length}
%%EOF`;

    return pdf;
  }

  private static downloadFile(
    dataUrl: string,
    filename: string,
    format: string
  ): void {
    const link = document.createElement('a');
    link.download = `${filename}.${format.toLowerCase()}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
