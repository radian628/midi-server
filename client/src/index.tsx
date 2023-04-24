import { createEffect, createSignal, on } from "solid-js";
import { For, render } from "solid-js/web";
import "./index.css";
import { Key } from "@solid-primitives/keyed";

async function fetchJSON(url: string): Promise<any> {
  return await (await fetch(url)).json();
}

type MidiMeta = {
  size: number;
  time: number;
  length: number;
};

async function getFileNames() {
  return ((await fetchJSON("/metadata")) as string[]).reverse();
}

async function getMeta(filename: string) {
  return (await fetchJSON(`/midi-meta/${filename}`)) as MidiMeta;
}

function formatDate(filename: string) {
  const [dd, mm, yyyy] = filename
    .slice(0, 10)
    .split("-")
    .map((s) => Number(s));
  return `${dd} ${
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][mm - 1]
  } ${yyyy}`;
}

function MidiPreview(props: { filename: string; daybreak: boolean }) {
  const [meta, setMeta] = createSignal<MidiMeta | undefined>();

  getMeta(props.filename).then(setMeta);

  return (
    <>
      {props.daybreak && (
        <tr>
          <td colspan="3" class="daybreak">
            {formatDate(props.filename)}
          </td>
        </tr>
      )}
      <tr>
        <td>
          <a href={`/midi/${props.filename}`}>{props.filename}</a>
        </td>
        <td>{meta()?.size ?? "..."}</td>
        <td>{Math.round(meta()?.length ?? 0)}</td>
      </tr>
    </>
  );
}

render(() => {
  const [fileNames, setFileNames] = createSignal<string[]>([]);

  getFileNames().then((fileNames) => setFileNames(fileNames));

  const [loadedCount, setLoadedCount] = createSignal(1);

  const fileDatas = () => {
    const data = fileNames();
    return data.reduce((prev, curr) => {
      const last = prev[prev.length - 1] ?? { name: "", daybreak: false };

      return [
        ...prev,
        { name: curr, daybreak: last.name.slice(0, 10) != curr.slice(0, 10) },
      ];
    }, [] as { name: string; daybreak: boolean }[]);
  };

  const firstN = () => fileDatas().slice(0, loadedCount());

  return (
    <div>
      <table class="midi-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <Key each={firstN()} by={(v) => v.name}>
            {(item) => (
              <MidiPreview
                filename={item().name}
                daybreak={item().daybreak}
              ></MidiPreview>
            )}
          </Key>
        </tbody>
      </table>
      <div
        style={{ transform: "translate(5px, -5px)" }}
        ref={(el) => {
          function checkBottom() {
            var rect = el.getBoundingClientRect();
            var viewHeight = Math.max(
              document.documentElement.clientHeight,
              window.innerHeight
            );

            if (
              !(rect.bottom < -10 || rect.top - viewHeight >= 10) &&
              fileNames().length > loadedCount()
            ) {
              setTimeout(() => {
                setLoadedCount(loadedCount() + 1);
                checkBottom();
              }, 0);
            }
          }

          createEffect(on(fileNames, () => checkBottom()));

          document.addEventListener("scroll", () => {
            checkBottom();
          });

          setInterval(() => {
            checkBottom();
          }, 250);
        }}
      ></div>
    </div>
  );
}, document.body);
