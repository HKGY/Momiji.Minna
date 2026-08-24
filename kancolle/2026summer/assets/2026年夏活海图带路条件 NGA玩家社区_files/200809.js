(function () {
  var bg_data = [{"pid":"200809","hiturl":"https://hi4fun.com/landing/fl1","wnUrl":"","box":"https://ad-static-xg.tagtic.cn/ad-material/images/vlDiKEnPxAyPzd03L21iQdRkZKwAvcGJ1W6ZjlQP.jpg","txt":"","tid":1,"width":970,"height":90,"weight":-2004.0888671875,"time":5,"IsUnion":1,"type":0,"impTrackerList":["https://g1.tagtic.cn/don/wn?encode_nyg=cmVxaWQ9TUJQQTF5V3l0SzBUekFrTWY5X01pJmNvbz0yN2U0MmQ0ZmMxYTNhNzY3OWVhMWE3ODQ2YjZiZmM3YTdmYzUwZjkwNGYyNDAxY2VlY2QwMmY0NzA3NzZmMDk0JmRwaWQ9MjdlNDJkNGZjMWEzYTc2NzllYTFhNzg0NmI2YmZjN2E3ZmM1MGY5MDRmMjQwMWNlZWNkMDJmNDcwNzc2ZjA5NCZvcz0zJnJlZj1odHRwcyUzQSUyRiUyRmJicy5uZ2EuY24lMkYmYWR2ZXJ1c2VyaWQ9OTAzJm9yZGVyaWQ9MjczNDUmYWlkPTE2MDQ3JnByb3ZpbmNlSWQ9MyZwYXltZW50PWNwdCZhZF9mcm9tPTAmbWlkPTE2MDQ3MiZncm91cF9pZD0xNjA0NzImcG9zaXRpb249MTcwMyZ3PTk3MCZoPTkwJmNvc3Q9MCZjb2VmZmljaWVudD0xJnNsb3RCaW5kaW5nPXNpbmdsZSZjb21wYXJlX2J1Y2tldF9pZD1hJnRyYWZmaWNfYnVja2V0X2lkPXAzNTI4MCZpc1VuaW9uPTE&v_y=55da96083c78a66dbd6c2c183de14ecce70faa1f67cd196d8d4603e3dbe0865e&"],"clkTrackerList":["https://g1.tagtic.cn/don/cl?encode_nyg=cmVxaWQ9TUJQQTF5V3l0SzBUekFrTWY5X01pJmNvbz0yN2U0MmQ0ZmMxYTNhNzY3OWVhMWE3ODQ2YjZiZmM3YTdmYzUwZjkwNGYyNDAxY2VlY2QwMmY0NzA3NzZmMDk0JmRwaWQ9MjdlNDJkNGZjMWEzYTc2NzllYTFhNzg0NmI2YmZjN2E3ZmM1MGY5MDRmMjQwMWNlZWNkMDJmNDcwNzc2ZjA5NCZvcz0zJnJlZj1odHRwcyUzQSUyRiUyRmJicy5uZ2EuY24lMkYmYWR2ZXJ1c2VyaWQ9OTAzJm9yZGVyaWQ9MjczNDUmYWlkPTE2MDQ3JnByb3ZpbmNlSWQ9MyZwYXltZW50PWNwdCZhZF9mcm9tPTAmbWlkPTE2MDQ3MiZncm91cF9pZD0xNjA0NzImcG9zaXRpb249MTcwMyZ3PTk3MCZoPTkwJmNvc3Q9MCZjb2VmZmljaWVudD0xJnNsb3RCaW5kaW5nPXNpbmdsZSZjb21wYXJlX2J1Y2tldF9pZD1hJnRyYWZmaWNfYnVja2V0X2lkPXAzNTI4MCZpc1VuaW9uPTE&v_y=55da96083c78a66dbd6c2c183de14ecce70faa1f67cd196d8d4603e3dbe0865e"]}];

  function request(urlList) {
    for (var i = 0; i < urlList.length; i++) {
      var url = urlList[i];
      var x = document.createElement("script")
      x.src = url;
      document.getElementsByTagName("head")[0].appendChild(x);
    }
  }

  if (bg_data.length > 0) {
    var ref = bg_data[0].box.substring(bg_data[0].box.lastIndexOf('/'), bg_data[0].box.lastIndexOf('.'));
    ngaAds.push({
      "id": "bbs_ads49",
      "isUnion": "" + bg_data[0].IsUnion + "",
      "file": "" + bg_data[0].box + "",
      "url": "" + bg_data[0].hiturl + "",
      "title": "",
      "width": "" + bg_data[0].width + "",
      "height": "" + bg_data[0].height + "",
      "date": "all",
      "rate": "100",
      "nolog": "1",
      "type": "" + bg_data[0].type + "",
      "sgid": bg_data[0].pid,
      "refreshid": "" + ref + "",
      "onload": function () {
        request(bg_data[0].impTrackerList)
      },
      "onclick": function () {
        request(bg_data[0].clkTrackerList)
      }
    });
  }
})();