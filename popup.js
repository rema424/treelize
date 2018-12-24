'use strict';

/**
 * 入力文字列を行でsplitして配列に格納する
 * @param {string} str 入力文字列
 * @return {array} 入力文字列を行ごとに分解した配列
 */
const convertInputStringToArray = str => str.trim().split(/\n/);

/**
 * 入力文字列がフォーマットに則っているか検証する
 * @param {array} arr
 * @return {object} フォーマットの検証結果
 */
const formatCheck = arr => {
  const formatErrorItems = arr
    .filter(val => !val.trim().startsWith('- ')) // 各行の先頭が '- ' に一致しなければフォーマットエラー
    .filter(val => !val.indexOf('- ') % 4 === 0); // 各行のインデントのスペースの数が4の倍数でない場合はフォーマットエラー

  const projectRootItems = arr.filter(val => val.startsWith('- '));

  let result = { status: false, message: '' };

  if (formatErrorItems.length || projectRootItems.length !== 1) {
    result.message = 'format error.';
  } else {
    result.status = true;
    result.message = 'format ok.';
  }

  return result;
};

/**
 * ディレクトリ・ファイルの深さを計算する
 * @param {*} arr
 */
const calcDepth = arr => {
  return arr.map(value => {
    const depth = value.indexOf('- ') / 4;
    return { depth, name: value };
  });
};

/**
 * インデントを調整する
 * @param {*} arr
 */
const adjustIndent = arr => {
  return arr.map(value => {
    let indent;
    if (value.depth > 1) {
      indent = `  ${'      '.repeat(value.depth - 1)}`;
    } else {
      indent = '  ';
    }

    if (value.depth > 0) {
      value.name = `${indent}├── ${value.name.trim().slice(2)}`;
    } else {
      value.name = value.name.trim().slice(2);
    }

    return value;
  });
};

/**
 * ツリーの角のラインを調整する
 * @param {*} arr
 */
const adjustCorner = arr => {
  return arr.map((value, index, self) => {
    const nextIndex = index + 1;
    const lastIndex = self.length - 1;

    if (nextIndex > lastIndex) {
      value.name = value.name.replace(/├/, '└');
    } else {
      for (let i = nextIndex; i < self.length; i++) {
        if (value.depth < self[i].depth) {
          continue;
        } else if (value.depth === self[i].depth) {
          break;
        } else {
          value.name = value.name.replace(/├/, '└');
        }
      }
    }
    return value;
  });
};

/**
 * ツリーのライン全体を調整する
 * @param {*} arr
 */
const adjustLines = arr => {
  return arr.map((value, index, self) => {
    const previousIndex = index - 1;

    // 深さ2以上の行が処理の対象
    if (value.depth > 1) {
      for (let d = value.depth - 1; d > 0; d--) {
        for (let i = previousIndex; i > 0; i--) {
          if (self[i].depth === d) {
            if (self[i].name.includes('├')) {
              const position = 2 + (d - 1) * 6;
              value.name = `${value.name.slice(0, position)}│${value.name.slice(position + 1)}`;
            }
            break;
          }
        }
      }
    }
    return value;
  });
};

/**
 * ディレクトリ名・ファイル名のみを抽出した配列を作成する
 * @param {*} arr
 */
const extractName = arr => arr.map(value => value.name);

/**
 * ページ読み込み時の初期化処理
 */
const init = () => {
  // DOMの取得
  const inputElement = document.getElementById('input');
  const outputElement = document.getElementById('output');
  const convertButtonElement = document.getElementById('convert');
  const copyButtonElement = document.getElementById('copy');

  inputElement.focus();

  // convertボタンクリック時のイベントの設定
  convertButtonElement.addEventListener('click', event => {
    event.preventDefault();

    // 入力文字列を取得する
    const input = inputElement.value;

    // 入力文字列が空なら何もせず処理を終える
    if (input === '') {
      inputElement.focus();
      return;
    }

    // 文字列を行ごとに分割して配列に格納する
    const inputArray = convertInputStringToArray(input);

    // 入力文字列のフォーマットをチェックする
    const formatCheckResult = formatCheck(inputArray);
    console.log(formatCheckResult.message);

    if (!formatCheckResult.status) {
      outputElement.value = formatCheckResult.message;
      inputElement.focus();
      return;
    }

    // ツリーを作成する
    const tree = extractName(adjustLines(adjustCorner(adjustIndent(calcDepth(inputArray))))).join(
      '\n'
    );

    outputElement.value = tree;
    console.log(tree);
  });

  // copyボタンクリック時のイベントの設定
  copyButtonElement.addEventListener('click', event => {
    event.preventDefault();

    // ツリー文字列作成前の場合は何もせず処理を終える
    if (!outputElement.value || outputElement.value === 'format error.') {
      inputElement.focus();
      return;
    }

    // 仮のエレメントを作成して値をコピーする
    const tmp = document.createElement('textarea');
    tmp.value = outputElement.value;

    // 画面に映らないようにスタイルを調整してDOMに追加する
    tmp.style.position = 'fixed';
    tmp.style.left = '-100%';
    document.body.appendChild(tmp);

    // テキストエリアの値を選択してクリップボードにコピーする
    tmp.select();
    document.execCommand('copy');

    // エレメントを削除する
    document.body.removeChild(tmp);

    // ボタンのテキストを変更してコピー完了を通知する
    copyButtonElement.textContent = 'copied!';
    setTimeout(() => {
      copyButtonElement.textContent = 'copy to clipboard';
    }, 2000);
  });
};

/**
 * DOMツリーが構築されたらinit関数を呼び出す
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  init();
});
