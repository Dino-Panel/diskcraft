<template>
  <div style="background-color: var(--bs-bg); color: var(--bs-text-default);">
    <section class="CardArea">
      <div
        class="card"
        v-if="
          $root.$children[0].api_capabilities &&
            $root.$children[0].api_capabilities.capabilities.pterodactylServer
        "
      >
        <div class="card-header">
          Pterodactyl Servers
        </div>
        <div class="card-body">
          <h5 class="card-title">Owned servers</h5>
          <p class="card-text" v-if="$root.$children[0].user.servers">
            You currently have
            {{
              $root.$children[0].user.servers.filter(
                (server) =>
                  server.owner == $root.$children[0].user.pterodactyl_id
              ).length
            }}
            servers.
          </p>
          <router-link
            to="/servers"
            style="color: var(--bs-button-text);"
            class="btn btn-primary rightBottomBtn"
          >
            <i
              class="fad fa-tasks-alt"
              style="color: var(--bs-button-text); position: relative; left: -2px; "
            ></i>
            Manage servers</router-link
          >
        </div>
      </div>

      <div
        class="card"
        v-if="
          $root.$children[0].user.vps &&
            $root.$children[0].api_capabilities.capabilities.qemuVps
        "
      >
        <div class="card-header">
          Virtual Private Servers
        </div>
        <div class="card-body">
          <h5 class="card-title" v-if="$root.$children[0].user.vps">
            Owned VPSs
          </h5>
          <p class="card-text">
            Your currently have
            {{
              $root.$children[0].user.vps.filter(
                (v) => v.parent == $root.$children[0].user.id
              ).length
            }}
            VPS{{
              $root.$children[0].user.vps.filter(
                (v) => v.parent == $root.$children[0].user.id
              ).length == 1
                ? ""
                : "s"
            }}.
          </p>
          <router-link
            to="/vps-manager"
            style="color: var(--bs-button-text);"
            class="btn btn-primary rightBottomBtn"
          >
            <i
              class="fad fa-tasks-alt"
              style="color: var(--bs-button-text); position: relative; left: -2px; "
            ></i>
            Manage VPSs</router-link
          >
        </div>
      </div>

      <div class="card ">
        <div class="card-header">
          Balance
        </div>
        <div class="card-body">
          <h5 class="card-title">
            Your current account balance:
            {{ $root.$children[0].api_capabilities.currency.symbol
            }}{{ priceFixer($root.$children[0].user.balance) }}
          </h5>
          <div class="card-text">
            <p style="margin-bottom: 1px">Order credit</p>
            <div class="input-group mb-3">
              <span class="input-group-text" id="basic-addon1">{{
                $root.$children[0].api_capabilities.currency.symbol
              }}</span>
              <input
                id="creditAmountAdding"
                type="number"
                class="form-control"
                placeholder="Amount"
                aria-label="Amount"
                value="5"
                max="100"
                min="5"
              />
            </div>
            <button
              @click="orderCredit()"
              style="float: right; color: var(--bs-button-text)"
              type="button"
              class="btn btn-primary"
            >
              <i
                class="fab fa-paypal"
                style="color: var(--bs-button-text); position: relative; left: -2px;"
              ></i>
              Pay with PayPal
            </button>
          </div>
        </div>
      </div>

      <div class="card ">
        <div class="card-header">
          Status
        </div>
        <div class="card-body">
          <h5 class="card-title">Connected services</h5>
          <div class="card-text">
            <div
              v-if="
                $root.$children[0].api_capabilities.capabilities
                  .pterodactylServer
              "
            >
              Pterodactyl:
              <span
                style="color: green"
                v-if="$root.$children[0].user.pterodactyl_id != null"
                >Connected</span
              ><span style="color: red" v-else>Not connected</span>
            </div>
            <div
              v-if="
                $root.$children[0].api_capabilities.capabilities
                  .discordAuthentication
              "
            >
              Discord:
              <span
                style="color: green"
                v-if="$root.$children[0].user.discord_id != null"
                >Connected</span
              ><span style="color: red" v-else>Not connected</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card ">
        <div class="card-header">
          Contact
        </div>
        <div class="card-body">
          <i
            class="fal fa-globe"
            v-if="$root.$children[0].api_capabilities.contact.website"
          ></i
          >&nbsp;&nbsp;
          <a :href="$root.$children[0].api_capabilities.contact.website.href">{{
            $root.$children[0].api_capabilities.contact.website.display
          }}</a
          ><br />

          <i
            class="fal fa-envelope"
            v-if="$root.$children[0].api_capabilities.contact.email"
          ></i
          >&nbsp;&nbsp;
          <a
            :href="$root.$children[0].api_capabilities.contact.email.href"
            v-if="$root.$children[0].api_capabilities.contact.email"
            >{{ $root.$children[0].api_capabilities.contact.email.display }}</a
          ><br />

          <i
            class="fal fa-phone"
            v-if="$root.$children[0].api_capabilities.contact.phone"
          ></i
          >&nbsp;&nbsp;
          <a
            v-if="$root.$children[0].api_capabilities.contact.phone"
            :href="$root.$children[0].api_capabilities.contact.phone.href"
            >{{ $root.$children[0].api_capabilities.contact.phone.display }}</a
          ><br />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.card-body a {
  color: var(--bs-text-default);
}
.CardArea {
  width: 95%;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.CardArea .card {
  background-color: var(--bs-card-bg);
  width: 400px;
  margin: 5px;
  flex-grow: 1;
}
.CardArea .card .card-header {
  background-color: var(--bs-card-header-bg);
}

@media only screen and (max-width: 1200px) {
  .CardArea {
    width: 95%;
  }
}

@media only screen and (min-width: 800px) {
  .rightBottomBtn {
    position: absolute;
    right: 15px;
    bottom: 15px;
  }
}

@media only screen and (max-width: 800px) {
  .CardArea {
    width: 99%;
  }
  .btn {
    width: 100%;
  }
}
</style>

<script>
export default {
  methods: {
    orderCredit() {
      var amount = document.getElementById("creditAmountAdding").value;
      var vm = this;

      fetch(`${vm.$root.$children[0].api_base_url}/@me/creditorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          amount: amount,
        }),
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            if (data.success == false) {
              //dont continue
            } else {
              window.location.href = data.data.url;
            }
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/creditorder`,
            },
            e
          );
        });
      console.log(amount);
    },
    storageBar() {
      return `width: ${this.quota.usedperc}%; background-color: #5c7cfa`;
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
  async mounted() {},
  data() {
    return {
      servers: [],
      pt_link: false,
      nc_link: false,
      quota: {
        usedperc: 0,
      },
      serverStats: {
        online: 0,
        offline: 0,
      },
      loading: {
        serverCard: true,
        statusCard: true,
        storageCard: true,
        balanceCard: false,
      },
    };
  },
};
</script>
