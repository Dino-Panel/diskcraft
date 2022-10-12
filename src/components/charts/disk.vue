<script>
import { Line } from "vue-chartjs";

export default {
  extends: Line,
  async mounted() {
    var vm = this;
    await vm.do_chart_setup();

    vm.interval = setInterval(async () => {
      var diskRead_points = vm.chartdata.datasets[0].data;
      var diskWrite_points = vm.chartdata.datasets[1].data;

      if (vm.current_scale == 0) {
        diskRead_points.push(vm.server().stats.diskRead / 100);
        diskWrite_points.push(vm.server().stats.diskWrite / 100);
      } else {
        diskRead_points.push(vm.server().stats.diskRead / 100000);
        diskWrite_points.push(vm.server().stats.diskWrite / 100000);
      }
      vm.chartdata.labels.push(vm.mysqlDate());

      if (
        diskRead_points.length > vm.dataPoints ||
        diskWrite_points.length > vm.dataPoints
      ) {
        diskWrite_points.splice(0, diskWrite_points.length - vm.dataPoints);
        diskRead_points.splice(0, diskRead_points.length - vm.dataPoints);
        vm.chartdata.labels.splice(
          0,
          vm.chartdata.labels.length - vm.dataPoints
        );
      }

      await vm.do_chart_scale_check();
      vm.renderChart(vm.chartdata, vm.options);
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.interval);
  },
  methods: {
    do_chart_scale_check() {
      return new Promise((res) => {
        var vm = this;
        var diskRead_points = vm.chartdata.datasets[0].data;
        var diskWrite_points = vm.chartdata.datasets[1].data;

        var upper_scale_activate = 900;
        var upper_scale_deactivate = 0.5; //must be in new scale

        var highest_item = 0;

        //check for activate value

        if (vm.current_scale == 0) {
          for (var data_point of diskRead_points) {
            if (highest_item < data_point) highest_item = data_point;
          }
          for (data_point of diskWrite_points) {
            if (highest_item < data_point) highest_item = data_point;
          }

          if (highest_item >= upper_scale_activate) {
            vm.switch_to_high_scale();
            vm.chartdata.datasets[0].label = "Disk Read (MBytes/s)";
            vm.chartdata.datasets[1].label = "Disk Write (MBytes/s)";
            vm.current_scale = 1;
          }
        }

        if (vm.current_scale == 1) {
          for (data_point of diskRead_points) {
            if (highest_item < data_point) highest_item = data_point;
          }
          for (data_point of diskWrite_points) {
            if (highest_item < data_point) highest_item = data_point;
          }

          if (highest_item <= upper_scale_deactivate) {
            vm.switch_to_low_scale();
            vm.chartdata.datasets[0].label = "Disk Read (KBytes/s)";
            vm.chartdata.datasets[1].label = "Disk Write (KBytes/s)";
            vm.current_scale = 0;
          }
        }

        res();
      });
    },
    switch_to_high_scale() {
      var vm = this;
      var diskRead_points = vm.chartdata.datasets[0].data;
      var diskWrite_points = vm.chartdata.datasets[1].data;

      var new_diskRead = [];
      var new_diskWrite = [];

      for (var data_point of diskRead_points) {
        new_diskRead.push(data_point / 1000);
      }
      for (data_point of diskWrite_points) {
        new_diskWrite.push(data_point / 1000);
      }

      vm.chartdata.datasets[0].data = new_diskRead;
      vm.chartdata.datasets[1].data = new_diskWrite;
    },
    switch_to_low_scale() {
      var vm = this;
      var diskRead_points = vm.chartdata.datasets[0].data;
      var diskWrite_points = vm.chartdata.datasets[1].data;

      var new_diskRead = [];
      var new_diskWrite = [];

      for (var data_point of diskRead_points) {
        new_diskRead.push(data_point * 1000);
      }
      for (data_point of diskWrite_points) {
        new_diskWrite.push(data_point * 1000);
      }

      vm.chartdata.datasets[0].data = new_diskRead;
      vm.chartdata.datasets[1].data = new_diskWrite;
    },
    do_chart_setup() {
      var vm = this;
      var diskRead_points = vm.chartdata.datasets[0].data;
      var diskWrite_points = vm.chartdata.datasets[1].data;

      return new Promise((res) => {
        fetch(
          `${vm.$root.$children[0].api_base_url}/@me/vps/${vm.uuid}/metrics?type=disk`,
          {
            headers: {
              Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
            },
          }
        ).then((resp) => {
          resp.json().then(async (data) => {
            var data_point_list = [];
            var i = 0;

            for (var data_point of data.data.reverse()) {
              if (i < vm.dataPoints) {
                data_point_list.push(data_point);
              }
              i++;
            }

            for (data_point of data_point_list.reverse()) {
              var time = data_point.time;
              var date = new Date();
              date.setTime(time);
              diskRead_points.push(data_point.data.diskRead / 100);
              diskWrite_points.push(data_point.data.diskWrite / 100);
              vm.chartdata.labels.push(vm.mysqlDate2(date));
            }

            await vm.do_chart_scale_check();

            vm.renderChart(vm.chartdata, vm.options);

            res();
          });
        });
      });
    },
    mysqlDate() {
      var vm = this;
      var date = new Date();
      return (
        vm.twoDigits(date.getHours()) +
        ":" +
        vm.twoDigits(date.getMinutes()) +
        ":" +
        vm.twoDigits(date.getSeconds())
      );
    },
    mysqlDate2(date) {
      var vm = this;
      return (
        vm.twoDigits(date.getHours()) +
        ":" +
        vm.twoDigits(date.getMinutes()) +
        ":" +
        vm.twoDigits(date.getSeconds())
      );
    },
    twoDigits(d) {
      if (0 <= d && d < 10) return "0" + d.toString();
      if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
      return d.toString();
    },
    server() {
      var vm = this;
      var vpsUuid = vm.uuid;

      if (vm.$root.$children[0].user) {
        var target = vm.$root.$children[0].user.vps.find((vps) => {
          return vps.uuid == vpsUuid;
        });

        if (!target) {
          //
        } else {
          return target;
        }
      }
      return;
    },
  },
  data: () => ({
    interval: null,
    current_scale: 0,
    chartdata: {
      labels: [],
      datasets: [
        {
          pointRadius: 0,
          label: "Disk Read (KBytes/s)",
          backgroundColor: "#00796B",
          borderColor: "#00796B",
          data: [],
          fill: false,
        },
        {
          pointRadius: 0,
          label: "Disk Write (KBytes/s)",
          backgroundColor: "#F9A825",
          borderColor: "#F9A825",
          data: [],
          fill: false,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Disk IO",
        fontColor: "white",
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0,
      },
      yAxes: [
        {
          display: true,
          ticks: {
            beginAtZero: true,
            suggestedMax: 100,
            suggestedMin: 0,
            max: 100,
            min: 0,
          },
        },
      ],
      tooltip: {
        intersect: true,
      },
    },
  }),
  props: ["uuid", "dataPoints"],
};
</script>
