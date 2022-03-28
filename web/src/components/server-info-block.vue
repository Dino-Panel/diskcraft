<template>
  <div class="card">
    <div
      class="card-header"
      style="padding-left: 10px; font-size: 16px; display: inline-flex"
    >
      <i
        v-if="server.renew == 0 || renew_disabled_overwrite == true"
        class="fad fa-times"
        style="margin-right: 5px; color: red"
      ></i>
      <i
        v-if="server.online == false && server.suspended == false"
        class="fad fa-server"
        style="color: orange"
      ></i
      ><i
        v-if="server.online == true && server.suspended == false"
        class="fad fa-server"
        style="color: green"
      ></i>
      <i
        v-if="server.suspended == true"
        class="fad fa-server"
        style="color: red"
      ></i>
      <p>
        {{ server.name }}
      </p>
    </div>
    <div v-if="server.is_installed === false">
      <div class="card-text">
        <div class="installing-block">
          <p>Server is installing.</p>
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="card-body" style="padding: 5px">
      <div class="card-text">
        <section class="containerDetails">
          <div class="containerDetailsBlock">
            <div style="margin: auto 8px; width: fit-content">
              <b>Suspended:</b> {{ server.suspended ? "Yes" : "No" }}
            </div>
            <div style="margin: auto 8px; width: fit-content">
              <b>Price:</b>
              {{ $root.$children[0].api_capabilities.currency.symbol
              }}{{ priceFixer(server.price) }}<small>/month</small>
            </div>
            <div style="margin: auto 8px; width: fit-content">
              <b
                >{{
                  server.renew == 0 || renew_disabled_overwrite == true
                    ? "Cancellation"
                    : "Renew"
                }}
                Date:</b
              >
              {{ mysqlDate(new Date(server.expiresAt)) }}
            </div>
            <div style="margin: auto 8px; width: fit-content">
              <b>Location:</b>
              {{ location_string(server.node_location) || "Unknown" }}
              <img
                class="location-flag"
                :src="flag_url(server.node_location)"
                style="height: 10px"
              />
            </div>
          </div>
          <div class="containerDetailsBlock">
            <div
              v-if="server.online == false"
              style="margin: auto 8px; width: fit-content"
            >
              <b>CPU:</b> {{ server.limits.cpu }}%
            </div>
            <div v-else style="margin: auto 8px; width: fit-content">
              <b>CPU:</b>
              {{
                Math.round(Math.round(server.statistics.cpuPercent * 100)) /
                  100
              }}% / {{ server.limits.cpu }}%
            </div>
            <div v-if="server.online == false" style="margin: auto 8px;">
              <b>RAM:</b> {{ server.limits.memory }}MB
            </div>

            <div v-else style="margin: auto 8px; width: fit-content">
              <b>RAM:</b>
              {{
                Math.round(
                  (Math.round(server.statistics.memPercent) / 100) *
                    server.limits.memory
                )
              }}MB / {{ server.limits.memory }}MB
            </div>
            <div style="margin: auto 8px; width: fit-content">
              <b>Disk:</b> {{ Math.round(server.limits.disk / 1024) }}GB
            </div>
          </div>
        </section>

        <div class="containerControlButtonsHolder">
          <button
            type="button"
            class="btn btn-dark sameSizeBtn actionBtn"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Start"
            :disabled="server.renew == 0 || renew_disabled_overwrite == true"
            @click="stopRenew(server.identifier)"
            style="color: var(--bs-button-text); min-height: 40px; margin: 2px"
          >
            <i
              class="fad fa-window-close"
              style="color: var(--bs-button-text); position: relative; left: -2px;"
            ></i>
            Cancel server
          </button>
          <button
            type="button"
            class="btn btn-danger sameSizeBtn actionBtn"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Start"
            :disabled="server.is_installed !== true"
            @click="reinstall_server(server.identifier)"
            style="color: var(--bs-button-text); min-height: 40px; margin: 2px"
          >
            <i
              class="fad fa-broom"
              style="color: var(--bs-button-text); position: relative; left: -2px;"
            ></i>
            Reinstall
          </button>
          <button
            @click="manageUrl(server.identifier)"
            class="btn btn-primary sameSizeBtn actionBtn"
            style="color: var(--bs-button-text); color: var(--bs-button-text); height: 40px; margin: 2px; max-height: 40px"
          >
            <i
              class="fad fa-tasks-alt"
              style="color: var(--bs-button-text); position: relative; left: -2px;"
            ></i>
            Manage
          </button>
          <button
            v-if="cancel_now == true"
            type="button"
            class="btn sameSizeBtn actionBtn"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Start"
            :disabled="server.renew == 1"
            @click="cancel_now_func(server.identifier)"
            style="color: var(--bs-button-text); min-height: 40px; margin: 2px; background-color: darkred"
          >
            <i
              class="fas fa-times"
              style="color: var(--bs-button-text); position: relative; left: -2px;"
            ></i>
            Cancel now
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-flag {
  position: relative;
  top: -1px;
}
.installing-block {
  font-size: 20px;
  text-align: center;
  padding: 10px;
}
.installing-block p {
  margin-bottom: 2px;
}
.containerDetails {
  display: flex;
  flex-wrap: wrap;
}
.containerDetailsBlock {
  width: 45%;
  flex-grow: 1;
  flex-shrink: 1;
}
.containerControlButtonsHolder {
  float: right;
  margin-right: 0px;
  position: relative;
  top: -1px;
}
.card-header p {
  margin-bottom: 0px;
  line-height: 28px;
  margin-left: 5px;
  color: var(--bs-text-default);
}
.card-header .fad {
  font-size: 20px;
}
.card {
  background-color: var(--bs-card-bg);
  width: 100%;
  margin: 5px;
  flex-grow: 1;
}
.card .card-header {
  background-color: var(--bs-card-header-bg);
}

.sameSizeBtn {
  width: 150px;
  height: 40px !important;
}

.smallCards .card-text {
  display: inline-flex;
  width: 100%;
}
.smallCards .containerDetails {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  width: 100%;
}
.smallCards .containerDetails b {
  flex-grow: 1;
}

.smallCards .containerDetails b::after {
  content: "\a";
  white-space: pre;
}

.smallCards .containerControlButtonsHolder {
  margin-left: auto;
}
.smallCards .actionBtn {
  float: right;
}
@media only screen and (max-width: 800px) {
  .smallCards .card-text {
    display: block;
  }
  .actionBtn {
    width: 100%;
  }
  .containerControlButtonsHolder {
    width: 100%;
    margin-right: 0px;
  }
}
</style>

<script>
export default {
  props: ["server", "cancel_now"],
  data() {
    return {
      renew_disabled_overwrite: false,
    };
  },
  methods: {
    cancel_now_func(server_identifier) {
      var vm = this;
      fetch(`${vm.$root.$children[0].api_base_url}/@admin/cancelnow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          service: "pterodactyl",
          id: server_identifier,
        }),
      }).then((res) => {
        res.json().then((data) => {
          vm.$root.$children[0].checkMessage(data);
        });
      });
    },
    reinstall_server(server_uuid) {
      var vm = this;

      fetch(
        `${vm.$root.$children[0].api_base_url}/@me/server/reset/${server_uuid}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          },
        }
      )
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/cancel`,
            },
            e
          );
        });
    },
    flag_url(location_string) {
      if (location_string == null) return;
      var init = location_string.indexOf("[");
      var fin = location_string.indexOf("]");
      return `/flags/${location_string.substr(init + 1, fin - init - 1)}.png`;
    },
    location_string(location_string_raw) {
      if (location_string_raw == null) return `Unkown`;
      var init = location_string_raw.indexOf("[");
      return location_string_raw.substr(0, init);
    },
    idToUser(id) {
      return this.$root.$children[0].users.find(
        (user) => user.pterodactyl_id == id
      );
    },
    mysqlDate(date) {
      var vm = this;
      date = vm.convertUTCDateToLocalDate(date);
      return (
        date.getFullYear() +
        "-" +
        vm.twoDigits(1 + date.getMonth()) +
        "-" +
        vm.twoDigits(date.getDate()) +
        " " +
        vm.twoDigits(date.getHours()) +
        ":" +
        vm.twoDigits(date.getMinutes()) +
        ":" +
        vm.twoDigits(date.getSeconds())
      );
    },
    convertUTCDateToLocalDate(date) {
      var newDate = new Date(
        date.getTime() + date.getTimezoneOffset() * 60 * 1000
      );

      var offset = date.getTimezoneOffset() / 60;
      var hours = date.getHours();

      newDate.setHours(hours - offset);

      return newDate;
    },
    twoDigits(d) {
      if (0 <= d && d < 10) return "0" + d.toString();
      if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
      return d.toString();
    },
    stopRenew(uuid) {
      var vm = this;
      vm.renew_disabled_overwrite = true;
      var target = this.$root.$children[0].user.servers.find((server) => {
        return server.identifier == uuid;
      });
      target.renew = 0;

      fetch(`${vm.$root.$children[0].api_base_url}/@me/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          service: "Servers",
          target: uuid,
        }),
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/cancel`,
            },
            e
          );
        });
    },
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return "0 Bytes";

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
    goto(path) {
      this.$router.push({
        path: path,
      });
    },
    manageUrl(identifier) {
      var vm = this;
      window.open(
        `${vm.$root.$children[0].api_capabilities.panel_url}/server/${identifier}`
      );
    },
    cancelUrl(uuid) {
      this.$router.push({
        path: `/confirm-delete/server/${uuid.split("-")[0]}`,
      });
    },
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
  },
};
</script>
