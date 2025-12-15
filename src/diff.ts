/*export class Diff {
  private readonly re = /<DIFF>([\s\S]*?)<\/DIFF>/g;

  parseDiffs(txt: string): string[] {
    const result: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = this.re.exec(txt)) !== null) {
      result.push(match[1]);
    }

    return result;
  }
}*/

export class Diff {
  private readonly tagStart = "<DIFF>";
  private readonly tagEnd = "</DIFF>";

  parseDiffs(txt: string): string[] {
    const ret: string[] = [];

    let cursor = 0;
    let offset = 0;
    while ((cursor = txt.indexOf(this.tagStart, offset)) !== -1) {
      offset = cursor + this.tagStart.length;
      const offsetEnd = txt.indexOf(this.tagEnd, offset);
      if (offsetEnd === -1) break;

      ret.push(txt.substring(offset, offsetEnd - 1));

      offset = offsetEnd + this.tagEnd.length;
    }

    return ret;
  }
}
