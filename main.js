const fs = require("fs");
const path = require("path");
const SVGSpriter = require("svg-sprite");

const config = {
  mode: {
    symbol: {
      inline: true,
    },
  },
};

const toCamelCase = (str) => {
  return str.replace(/-([a-z])/g, function (g) {
    return g[1].toUpperCase();
  });
};

const modifyAttributesToCamelCase = (node) => {
  const attributes = node.attributes;
  for (let i = attributes.length - 1; i >= 0; i--) {
    const attr = attributes[i];
    const camelCaseName = toCamelCase(attr.name);
    if (camelCaseName !== attr.name) {
      node.removeAttribute(attr.name);
      node.setAttribute(camelCaseName, attr.value);
    }
  }

  const childNodes = node.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    if (child.nodeType === 1) {
      modifyAttributesToCamelCase(child);
    }
  }
};

const transferSvgToSprite = async () => {
  const spriter = new SVGSpriter(config);
  const folderPath = "./icons";
  const files = fs.readdirSync(folderPath);

  files.forEach((file) => {
    const filePath = `./${path.join(folderPath, file)}`;
    spriter.add(filePath, null, fs.readFileSync(filePath, "utf-8"));
  });

  console.log("File Load 성공! SVG Sprite 변환이 시작됩니다.");
  console.log(
    "-----------------------------------------------------------------"
  );
  spriter.compile((error, result) => {
    for (const mode in result) {
      for (const resource in result[mode]) {
        fs.mkdirSync(path.dirname(result[mode][resource].path), {
          recursive: true,
        });
        fs.writeFileSync(
          result[mode][resource].path,
          result[mode][resource].contents
        );
      }
    }
  });

  console.log("SVG Sprite 변환 완료! 파일이 생싱 또는 수정되었습니다.");

  const svgCode = await fs.promises.readFile(
    "./symbol/svg/sprite.symbol.svg",
    "utf-8"
  );
  const DOMParser = require("xmldom").DOMParser;

  console.log(
    "-----------------------------------------------------------------"
  );
  console.log("svg sprite json 파일 수정을 시작합니다.");
  const xmlDoc = new DOMParser().parseFromString(svgCode, "text/xml");

  const svgElement = xmlDoc.getElementsByTagName("svg")[0];
  const symbolElements = xmlDoc.getElementsByTagName("symbol");

  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgElement.removeAttribute("width");
  svgElement.removeAttribute("height");
  svgElement.removeAttribute("style");

  Array.from(symbolElements).forEach((symbol) => {
    symbol.removeAttribute("fill");
    modifyAttributesToCamelCase(symbol);
  });

  const modifiedSvgCode = xmlDoc.toString();

  fs.writeFileSync("./symbol/svg/sprite.symbol.svg", modifiedSvgCode, "utf-8");

  console.log(
    "-----------------------------------------------------------------"
  );
  console.log("svg sprite json 파일 수정을 완료하였습니다.");
};

transferSvgToSprite();
