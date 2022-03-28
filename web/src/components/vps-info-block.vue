<template>
  <div class="vps-block block-installing" v-if="vpsInstance.installed == false">
    <div class="vps-name-power-icon">
      <div class="power-icon">
        <i class="fad fa-scrubber power-icon breathe" style="color:aqua"></i>
      </div>
      <p class="vps-name">{{ vpsInstance.alias || vpsInstance.name }}</p>
    </div>
    <div class="installing-block-guardrail"></div>
    <div class="installing">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Installing</p>
    </div>
  </div>
  <div
    class="vps-block clickable"
    @click="go_to_manager(vpsInstance.uuid)"
    v-else
  >
    <div class="vps-name-power-icon">
      <div class="power-icon" v-if="vpsInstance.suspended == false">
        <i
          class="fad fa-scrubber power-icon breathe"
          style="color:green"
          v-if="vpsInstance.status == 'Running'"
        ></i>
        <i class="fad fa-scrubber power-icon" style="color:orange" v-else></i>
      </div>
      <div class="power-icon" v-else>
        <i class="fad fa-scrubber power-icon" style="color:red"></i>
      </div>
      <p class="vps-name">{{ vpsInstance.alias || vpsInstance.name }}</p>
    </div>

    <div class="vps-ipv4-network-info">
      <div
        class="vps-ipv4-network-info-text"
        v-if="vpsInstance.network.ipv4_enabled == 1"
      >
        <b class="block-1">IPv4:</b>
        <p class="block-2">{{ vpsInstance.network.ipv4_address }}</p>
      </div>
    </div>

    <div class="vps-ipv6-network-info">
      <div
        class="vps-ipv6-network-info-text"
        v-if="vpsInstance.network.ipv6_enabled == 1"
      >
        <b class="block-1">IPv6:</b>
        <p class="block-2">{{ vpsInstance.network.ipv6_address }}</p>
      </div>
    </div>

    <div class="vps-price">
      <p class="vps-price-text">
        {{ $root.$children[0].api_capabilities.currency.symbol
        }}{{ priceFixer(vpsInstance.price) }}<small>/month</small>
      </p>
    </div>

    <div class="vps-action-date">
      <b class="block-1"
        >{{
          vpsInstance.renew == 0 || renew_disabled_overwrite == true
            ? "Cancellation"
            : "Renew"
        }}
        Date:</b
      >
      <p class="block-2">{{ mysqlDate(new Date(vpsInstance.expiresAt)) }}</p>
    </div>
    <div class="vps-shell-icon-holder">
      <div
        class="vps-shell-icon"
        v-if="has_shell()"
        @click="open_shell_window()"
      >
        <i class="fal fa-terminal"></i>
      </div>
    </div>
    <div class="vps-monitor-icon-holder">
      <div class="vps-monitor-icon" @click="open_console_window()">
        <i class="fal fa-desktop-alt"></i>
      </div>
    </div>

    <div class="vps-share">
      <div class="vps-share-icon" v-if="vpsInstance.is_share == true">
        <i class="far fa-share"></i>
      </div>
    </div>

    <div class="vps-cancel-btn-holder" v-if="cancelNowOnly == true">
      <button
        type="button"
        class="btn btn-warning cancel-btn"
        :disabled="vpsInstance.renew != 0"
        @click="delete_vps(vpsInstance)"
      >
        <i
          class="fad fa-window-close"
          style="color: var(--bs-button-text);position: relative; left: -2px;"
        ></i>
        Cancel now
      </button>
    </div>

    <div class="vps-cancel-btn-holder" v-else>
      <button
        type="button"
        class="btn btn-dark cancel-btn"
        :disabled="
          vpsInstance.renew == 0 ||
            vpsInstance.is_share == true ||
            renew_disabled_overwrite == true
        "
        @click="stop_vps_renewal(vpsInstance)"
      >
        <i
          class="fad fa-window-close"
          style="color: var(--bs-button-text);position: relative; left: -2px;"
        ></i>
        Cancel server
      </button>
    </div>
  </div>
</template>

<style>
@media only screen and (max-width: 1300px) {
  .vps-ipv6-network-info {
    display: none;
  }
}

@media only screen and (max-width: 950px) {
  .vps-monitor-icon-holder,
  .vps-shell-icon-holder {
    display: none;
  }
}

@media only screen and (max-width: 850px) {
  .vps-ipv6-network-info {
    display: block;
  }
  .vps-action-date,
  .vps-cancel-btn-holder {
    display: none;
  }
  .installing-block-guardrail {
    width: 390px !important;
  }
}

@media only screen and (max-width: 650px) {
  .vps-ipv6-network-info {
    display: none;
  }
  .installing-block-guardrail {
    width: 80px !important;
  }
}

@media only screen and (max-width: 500px) {
  .vps-price {
    display: none;
  }
  .installing-block-guardrail {
    width: 100px !important;
  }
}

@media only screen and (max-width: 330px) {
  .vps-ipv4-network-info {
    display: none;
  }
  .installing {
    display: none !important;
  }
  .installing-block-guardrail {
    width: 50px !important;
  }
}
@media only screen and (max-width: 250px) {
  .vps-share {
    display: none;
  }
}
.installing-block-guardrail {
  width: 435px;
}
.installing {
  display: inline-flex;
}
.installing p {
  position: relative;

  top: 2px;
}
.installing .spinner-border {
  height: 25px;
  width: 25px;
  position: relative;
  right: 8px;
  top: 2px;
}

.vps-share {
  width: 50px;
  position: relative;
  display: block;
}
.vps-share-icon {
  position: absolute;
  width: fit-content;
  height: fit-content;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
}

.vps-monitor-icon-holder,
.vps-shell-icon-holder {
  flex-grow: 1;
  font-size: 21px;
  margin: 0px 15px;
  width: fit-content;
  position: relative;
}

.vps-monitor-icon,
.vps-shell-icon {
  font-size: 21px;
  width: fit-content;
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
}
.vps-monitor-icon:hover,
.vps-shell-icon:hover {
  filter: brightness(50%);
}

.vps-action-date {
  text-align: center;
  font-size: 14px;
  position: relative;
  top: -7px;
  margin-left: 20px;
  flex-grow: 1;
}
.vps-action-date .block-1 {
  width: 100%;
}
.vps-action-date .block-2 {
  width: 100%;
  margin: 0px;
}

.cancel-btn {
  color: var(--bs-button-text);
  min-height: 40px;
  position: relative;
  top: -5px;
  z-index: 9;
}

.vps-cancel-btn-holder {
  float: right;
  margin-left: auto;
  z-index: 9;
}

.vps-price-text {
  width: 100px;
  margin: 0px;
  line-height: 30px;
  margin-left: 5px;
}
.vps-ipv4-network-info {
  width: 110px;
  margin: 0px;
  line-height: 30px;
  margin-left: 5px;
  text-align: center;
  font-size: 14px;
  position: relative;
  top: -10px;
  flex-grow: 1;
}
.vps-ipv4-network-info .vps-ipv4-network-info-text .block-1 {
  width: 100%;
}
.vps-ipv4-network-info .vps-ipv4-network-info-text .block-2 {
  width: 100%;
  margin: 0px;
  position: relative;
  top: -12px;
}

.vps-ipv6-network-info {
  width: 200px;
  margin: 0px;
  line-height: 30px;
  margin-left: 5px;
  text-align: center;
  font-size: 14px;
  position: relative;
  top: -10px;
  flex-grow: 1;
}
.vps-ipv6-network-info .vps-ipv6-network-info-text .block-1 {
  width: 100%;
}
.vps-ipv6-network-info .vps-ipv6-network-info-text .block-2 {
  width: 100%;
  margin: 0px;
  position: relative;
  top: -12px;
}

.vps-name-power-icon {
  display: inline-flex;
}
.vps-name-power-icon .power-icon {
  position: relative;
  top: 0px;
  font-size: 20px;
}
.vps-name-power-icon .vps-name {
  font-size: 16px !important;
  margin: 0px;
  line-height: 30px;
  margin-left: 5px;
  width: 180px;
}

.vps-block {
  font-size: 16px !important;
  display: block;
  background-color: var(--bs-card-bg);
  padding: 15px;
  margin: 10px;
  width: 100%;
  border-radius: 5px;
  height: 60px;
  display: inline-flex;

  justify-content: space-between;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  filter: brightness(110%);
}

.breathe {
  animation: breathing 5s ease-out infinite normal;
}

@keyframes breathing {
  0% {
    -webkit-transform: scale(0.9);
    -ms-transform: scale(0.9);
    transform: scale(0.9);
  }

  25% {
    -webkit-transform: scale(1);
    -ms-transform: scale(1);
    transform: scale(1);
  }

  60% {
    -webkit-transform: scale(0.9);
    -ms-transform: scale(0.9);
    transform: scale(0.9);
  }

  100% {
    -webkit-transform: scale(0.9);
    -ms-transform: scale(0.9);
    transform: scale(0.9);
  }
}
</style>

<script>
export default {
  props: ["vpsInstance", "cancelNowOnly"],
  data() {
    return {
      prevent_navigate: false,
      renew_disabled_overwrite: false,
    };
  },
  methods: {
    has_shell() {
      var vm = this;
      var firewall_rules = vm.vpsInstance.firewall_rules;
      var ssh_rule = firewall_rules.find((r) => r.private_port == 22);
      if (ssh_rule) {
        return true;
      } else {
        return false;
      }
    },
    open_shell_window() {
      var vm = this;
      vm.prevent_navigate = true;
      setTimeout(() => {
        vm.prevent_navigate = false;
      }, 250);
      window.open(
        `${location.origin}/shell/${this.vpsInstance.uuid}`,
        "show_window",
        `toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=1025px,height=861px`
      );
    },
    open_console_window() {
      var vm = this;
      vm.prevent_navigate = true;
      setTimeout(() => {
        vm.prevent_navigate = false;
      }, 250);
      window.open(
        `${location.origin}/console/${this.vpsInstance.uuid}`,
        "show_window",
        `toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=1025px,height=861px`
      );
    },
    delete_vps(vps) {
      var vm = this;
      vm.prevent_navigate = true;
      setTimeout(() => {
        vm.prevent_navigate = false;
      }, 250);
      var vpsUUID = vps.id;

      fetch(`${vm.$root.$children[0].api_base_url}/@admin/cancelnow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          service: "vps",
          id: vpsUUID,
        }),
      }).then((res) => {
        res.json().then((data) => {
          vm.$root.$children[0].checkMessage(data);
        });
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
    go_to_manager(uuid) {
      if (this.prevent_navigate == true) return;
      this.$router.push({
        path: `/vps/${uuid}`,
      });
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
    stop_vps_renewal(vps) {
      var vm = this;
      vm.prevent_navigate = true;
      vps.renew = false;
      vm.renew_disabled_overwrite = true;
      setTimeout(() => {
        vm.prevent_navigate = false;
      }, 250);
      var vpsUUID = vps.uuid;

      fetch(`${vm.$root.$children[0].api_base_url}/@me/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          service: "VPS",
          target: vpsUUID,
        }),
      }).then((res) => {
        res.json().then((data) => {
          vm.$root.$children[0].checkMessage(data);
        });
      });
    },
  },
};
</script>
