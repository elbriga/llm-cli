export class Diff {
  private readonly re = /<DIFF>([\s\S]*?)<\/DIFF>/g;

  parseDiffs(txt: string): { name: string; content: string }[] {
    const result: { name: string; content: string }[] = [];
    let match: RegExpExecArray | null;

    while ((match = this.re.exec(txt)) !== null) {
      console.log("--------------==============>>>>>>");
      console.log(match);
      console.log("--------------==============>>>>>>");
      const fileName = "";
      result.push({ name: fileName, content: match[1] });
    }

    return result;
  }
}

/*export class Diff {
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

      ret.push(txt.substring(offset, offsetEnd));

      offset = offsetEnd + this.tagEnd.length;
    }

    return ret;
  }
}*/
