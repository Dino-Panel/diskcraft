<template>
  <div style="padding-bottom: 10px">
    <div
      class="type"
      v-if="
        data.vps && $root.$children[0].api_capabilities.capabilities.qemuVps
      "
    >
      <h2>Virtual Private Servers</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>CPU Cores</th>
            <th>RAM</th>
            <th>Storage</th>
            <th>IPv4</th>
            <th>IPv6</th>
            <th>VNC</th>
            <th>Monthly Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in data.vps" :key="5000 + i">
            <td class="has-responsive-th">
              <span class="responsive-th">Name</span>{{ item.name }}
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">CPU Cores</span>{{ item.core_count }}
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">RAM</span>{{ item.ram }} GB
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">Storage</span
              >{{ Math.round(item.disk) == 0 ? "∞" : Math.round(item.disk) }} GB
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">IPv4</span> Internal, with public
              optional
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">IPv6</span> Yes
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">VNC</span> Yes
            </td>
            <td class="highlight has-responsive-th">
              <span class="responsive-th">Monthly Price</span
              >{{ $root.$children[0].api_capabilities.currency.symbol
              }}{{ priceFixer(item.price) }}
            </td>
            <td class="deployInTable">
              <button
                type="button"
                class="btn btn-primary deployBtn"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Deploy"
                style="color: var(--bs-button-text); min-height: 40px; margin: 5px"
                @click="deployVps(item.code)"
              >
                <i
                  class="fad fa-rocket-launch"
                  style="color: var(--bs-button-text);position: relative; left: -2px;"
                ></i>
                Deploy
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      class="type"
      v-for="(ptCat, index) in data.pterodactyl"
      :key="index + 99999"
    >
      <h2>{{ ptCat.name }}</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>CPU Cores</th>
            <th>RAM</th>
            <th>Storage</th>
            <th>Backups</th>
            <th>Databases</th>
            <th>Monthly Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in ptCat.list" :key="index * 100 + i">
            <td class="has-responsive-th">
              <span class="responsive-th">Name</span>{{ item.name }}
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">CPU Cores</span>{{ item.cpu / 100 }}
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">RAM</span
              >{{
                item.ram > 1023 ? `${item.ram / 1024} GB` : `${item.ram} MB`
              }}
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">Storage</span
              >{{
                Math.round(item.disk / 1024) == 0
                  ? "∞"
                  : Math.round(item.disk / 1024)
              }}
              GB
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">Backups</span>{{ item.backups }}
            </td>
            <td class="has-responsive-th">
              <span class="responsive-th">Databases</span>{{ item.databases }}
            </td>
            <td class="highlight has-responsive-th">
              <span class="responsive-th">Monthly Price</span
              >{{ $root.$children[0].api_capabilities.currency.symbol
              }}{{ priceFixer(item.price) }}
            </td>
            <td class="deployInTable">
              <button
                type="button"
                class="btn btn-primary deployBtn"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Deploy"
                style="color: var(--bs-button-text); min-height: 40px; margin: 5px"
                @click="deploy(item.code)"
              >
                <i
                  class="fad fa-rocket-launch"
                  style="color: var(--bs-button-text);position: relative; left: -2px;"
                ></i>
                Deploy
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  mounted() {
    var vm = this;
    fetch(`${vm.$root.$children[0].api_base_url}/@me/deploy`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
      },
    })
      .then((res) => {
        res.json().then((data) => {
          if (data.success == false) {
            vm.$root.$children[0].checkMessage(data);
          }
          vm.data = data.data;
        });
      })
      .catch((e) => {
        vm.$root.$children[0].reportError(
          {
            panel: vm.$router.path,
            request: `${vm.$root.$children[0].api_base_url}/@me/deploy`,
          },
          e
        );
      });
  },
  methods: {
    priceFixer(input) {
      var vm = this;
      if (input == undefined) return;
      vm.api_capabilities = vm.$root.$children[0].api_capabilities;
      if (input.toString().includes(".")) {
        var returnStr = (Math.round(input * 100) / 100)
          .toString()
          .replace(".", vm.api_capabilities.currency.separator);
        if (
          returnStr.split(vm.api_capabilities.currency.separator)[1] &&
          returnStr.split(vm.api_capabilities.currency.separator)[1].length == 1
        )
          returnStr += `0`;

        if (returnStr.split(vm.api_capabilities.currency.separator)[1] == null)
          returnStr += `${vm.api_capabilities.currency.separator}00`;

        return returnStr;
      } else {
        return input + `${vm.api_capabilities.currency.separator}00`;
      }
    },
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return "0 Bytes";

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
    deploy(type) {
      var vm = this;
      var jobId = vm.$root.$children[0].createJob(
        `Please wait while your server is being created.`
      );
      fetch(`${vm.$root.$children[0].api_base_url}/@me/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          service: "pterodactyl",
          package: type,
        }),
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            vm.$root.$children[0].stopJob(jobId);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].stopJob(jobId);
          vm.$root.$children[0].checkMessage({
            messages: [
              {
                isError: true,
                title: "Deployment",
                content: `API ERROR: ${e}`,
              },
            ],
          });
        });
      vm.$router.push({
        path: "/servers",
      });
    },

    deployVps(type) {
      var vm = this;
      var jobId = vm.$root.$children[0].createJob(
        `Please wait while your VPS is being created.`
      );
      fetch(`${vm.$root.$children[0].api_base_url}/@me/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          service: "vps",
          package: type,
        }),
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            vm.$root.$children[0].stopJob(jobId);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].stopJob(jobId);
          vm.$root.$children[0].checkMessage({
            messages: [
              {
                isError: true,
                title: "Deployment",
                content: `API ERROR: ${e}`,
              },
            ],
          });
        });
      vm.$router.push({
        path: "/vps-manager",
      });
    },
  },
  data() {
    return {
      data: [],
      deploy_error: "Joe",
      state: "start",
    };
  },
};
</script>

<style scoped>
.deployBtn {
  width: 100%;
}

@media only screen and (min-width: 950px) {
  .deployInTable {
    width: 110px;
  }
  .deployBtn {
    width: 120px;
  }
}

.type {
  width: 95%;
  margin: 10px auto;
}

.type:not(:first-child) {
  width: 95%;
  margin: 10px auto;
  margin-top: 40px;
}

h1,
h2,
h3 {
  color: var(--bs-text-default);
}
table {
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  text-align: center;
  background-color: var(--bs-card-bg);
  border: 2px solid #ffffff;
  color: var(--bs-text-default);
  border-collapse: separate;
  border-radius: 12px;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
}
th {
  display: table-cell;
  vertical-align: inherit;
  font-weight: bold;
  text-align: -internal-center;
}
tr {
  display: table-row;
  vertical-align: inherit;
  border-bottom: 1px solid var(--bs-card-border);
}
td {
  margin-top: 10px;
}
tbody {
  display: table-row-group;
  vertical-align: middle;
  border-color: inherit;
}
.responsive-th {
  display: none;
}

@media only screen and (max-width: 950px) {
  h1,
  h2,
  h3 {
    text-align: center;
  }
  .responsive-th {
    display: block;
    filter: opacity(0.75);
  }
  thead {
    display: none;
  }
  tr {
    display: block;
    padding: 10px;
    width: 100%;
  }

  td {
    width: 100%;
    display: block;
  }
}
.has-responsive-th {
  margin-top: 0px;
}
</style>
