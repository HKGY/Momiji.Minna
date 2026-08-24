(function () {
  var bg_data = [{"pid":"778","hiturl":"","wnUrl":"","box":"","tid":0,"width":760,"height":500,"weight":-1475.020751953125,"time":5,"IsUnion":2,"type":33,"impTrackerList":["https://g1.tagtic.cn/don/wn?encode_nyg=cmVxaWQ9SU1UNGV5TFFTb0RpcHZWRDhZeEVYJmNvbz0yN2U0MmQ0ZmMxYTNhNzY3OWVhMWE3ODQ2YjZiZmM3YTdmYzUwZjkwNGYyNDAxY2VlY2QwMmY0NzA3NzZmMDk0JmRwaWQ9MjdlNDJkNGZjMWEzYTc2NzllYTFhNzg0NmI2YmZjN2E3ZmM1MGY5MDRmMjQwMWNlZWNkMDJmNDcwNzc2ZjA5NCZvcz0zJnJlZj1odHRwcyUzQSUyRiUyRmJicy5uZ2EuY24lMkYmYWR2ZXJ1c2VyaWQ9MTA5Jm9yZGVyaWQ9NzQ4JmFpZD1wOTg0OTYmcHJvdmluY2VJZD0xNSZwYXltZW50PWNwdCZhZF9mcm9tPTMzJnBvc2l0aW9uPTY2MiZ3PTAmaD0wJmNvc3Q9MCZjb2VmZmljaWVudD0wJnNsb3RCaW5kaW5nPXNpbmdsZSZjb21wYXJlX2J1Y2tldF9pZD1hJnRyYWZmaWNfYnVja2V0X2lkPXAzMzIwOCZpc1VuaW9uPTI&v_y=f2f47fe3cb7fdf555798d8eb97ad73ea1f39f613932e9a6bee8a726ad44b94f9&"],"clkTrackerList":["https://g1.tagtic.cn/don/cl?encode_nyg=cmVxaWQ9SU1UNGV5TFFTb0RpcHZWRDhZeEVYJmNvbz0yN2U0MmQ0ZmMxYTNhNzY3OWVhMWE3ODQ2YjZiZmM3YTdmYzUwZjkwNGYyNDAxY2VlY2QwMmY0NzA3NzZmMDk0JmRwaWQ9MjdlNDJkNGZjMWEzYTc2NzllYTFhNzg0NmI2YmZjN2E3ZmM1MGY5MDRmMjQwMWNlZWNkMDJmNDcwNzc2ZjA5NCZvcz0zJnJlZj1odHRwcyUzQSUyRiUyRmJicy5uZ2EuY24lMkYmYWR2ZXJ1c2VyaWQ9MTA5Jm9yZGVyaWQ9NzQ4JmFpZD1wOTg0OTYmcHJvdmluY2VJZD0xNSZwYXltZW50PWNwdCZhZF9mcm9tPTMzJnBvc2l0aW9uPTY2MiZ3PTAmaD0wJmNvc3Q9MCZjb2VmZmljaWVudD0wJnNsb3RCaW5kaW5nPXNpbmdsZSZjb21wYXJlX2J1Y2tldF9pZD1hJnRyYWZmaWNfYnVja2V0X2lkPXAzMzIwOCZpc1VuaW9uPTI&v_y=f2f47fe3cb7fdf555798d8eb97ad73ea1f39f613932e9a6bee8a726ad44b94f9"]}];

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
      "id": "bbs_ads12",
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