const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

function createChart(vpsUUID) {
  return new Promise(async (res) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 443,
    });

    await page.goto(`https://panel.diskos.net/vps/${vpsUUID}/chart`);
    await page.evaluate(async () => {
      function createJwtToken() {
        return new Promise((res) => {
          fetch(`https://panel.diskos.net/api/auth`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
              "Content-Type": "application/json",
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify({
              username: "bot_user",
              password: "2006!Jeroen",
            }),
          }).then((resp) => {
            resp.json().then((data) => {
              if (data.success == true) {
                res(data.data.jwt);
              }
            });
          });
        });
      }

      const jwt = await createJwtToken();

      localStorage.setItem("jwt", jwt);
    });
    await page.goto(`https://panel.diskos.net/vps/${vpsUUID}/chart`);

    setTimeout(async () => {
      var path = `./images/${vpsUUID}.png`;
      await page.evaluate(async () => {
        //window.scrollTo(0, 50);
        var elm = document.getElementsByClassName("navbar")[0];
        elm.style.display = "none";
      });
      await page.screenshot({ path: path });
      await browser.close();
      res(path);
    }, 3000);
  });
}

async function run() {
  if (process.argv[2]) {
    console.log(await createChart(process.argv[2]));
    process.exit(200);
  }
}

run();
