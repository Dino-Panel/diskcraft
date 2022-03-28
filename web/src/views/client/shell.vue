<template>
  <div class="monitor">
    <div class="monitor-frame">
      <iframe
        v-if="has_shell() == true"
        id="monitor-iframe"
        :src="shell_src()"
        class="monitor-iframe"
      ></iframe>
      <p v-else class="monitor-iframe" style="color:white;">
        VPS Doesn't support SSH
      </p>
      <div class="monitor-info-block">
        <div class="side-1 side">
          <p class="side-item">
            <b>Server:</b> {{ server().alias || server().name }}
          </p>
          <p class="side-item">
            <b>Location:</b> {{ location_string() }}
            <img class="location-flag" :src="flag_url()" />
          </p>
        </div>
        <div class="side-2 side">
          <p class="side-item">
            <b>IPv4:</b> {{ server().network.ipv4_address }}
          </p>
          <p class="side-item">
            <b>IPv6:</b> {{ server().network.ipv6_address }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-flag {
  height: 15px;
  position: relative;
  top: -1px;
}
.monitor-info-block .side {
  flex-grow: 1;
  padding: 2px;
  color: white;
}

.side-item {
  font-size: 19px;
  margin-bottom: 3px;
}

.monitor-info-block {
  background-color: rgb(40, 40, 40);
  max-width: 1025px;
  height: 90px;
  position: relative;
  top: -6px;
  display: flex;
  padding: 10px;
}
.monitor-iframe {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.monitor-frame {
  max-height: 770px;
  height: 770px;
  max-width: 1025px;
  position: absolute;
  top: 0;
  bottom: 90px;
  left: 0;
  right: 0;
  margin: auto;
}
.monitor {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>

<script>
export default {
  mounted() {
    this.$root.$children[0].disable_tawk = true;
    this.$root.$children[0].show_nav = false;
  },
  methods: {
    shell_src() {
      var vps = this.server();
      var ssh_uri = this.ssh_server();

      return `${window.origin}/ssh/host/${vps.node}?port=${
        ssh_uri.split(":")[1]
      }&username=${this.server().cloudinit_username}&password=${
        this.server().cloudinit_password
      }`;
    },
    has_shell() {
      var vm = this;
      var firewall_rules = vm.server().firewall_rules;
      var ssh_rule = firewall_rules.find((r) => r.private_port == 22);
      if (ssh_rule) {
        return true;
      } else {
        return false;
      }
    },
    server() {
      var vm = this;
      var vpsUuid = vm.$route.params.vps_uuid;

      if (vm.$root.$children[0].user) {
        var target = vm.$root.$children[0].user.vps.find((vps) => {
          return vps.uuid == vpsUuid;
        });

        if (!target) {
          this.$router.push({
            path: "/vps-manager",
          });
        } else {
          return target;
        }
      }
      return;
    },
    ssh_server() {
      var vm = this;
      var firewall_rules = vm.server().firewall_rules;
      var ssh_rule = firewall_rules.find((r) => r.private_port == 22);
      if (ssh_rule) {
        return `${vm.server().node}:${ssh_rule.public_port}`;
      } else {
        return `No firewall rule`;
      }
    },
    flag_url() {
      var location_string = this.server().location;
      var init = location_string.indexOf("[");
      var fin = location_string.indexOf("]");
      return `/flags/${location_string.substr(init + 1, fin - init - 1)}.png`;
    },
    location_string() {
      var location_string_raw = this.server().location;
      if (location_string_raw == null) return `Unkown`;
      var init = location_string_raw.indexOf("[");
      return location_string_raw.substr(0, init);
    },
  },
};
</script>
