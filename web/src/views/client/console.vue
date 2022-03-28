<template>
  <div class="monitor">
    <div class="monitor-frame">
      <iframe
        id="monitor-iframe"
        :src="frameSrc()"
        class="monitor-iframe"
      ></iframe>
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
    frameSrc() {
      var vm = this;
      return `/novnc/?autoconnect=true&password=${
        vm.server().vnc_password
      }&reconnect=true&reconnect_delay=1000&host=${
        vm.server().vnc_server
      }?noport=${vm.server().novnc_port}`;
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
