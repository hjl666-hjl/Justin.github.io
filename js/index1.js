(function () {
  // 获奖轮播
  let currentIndex = 0;
  let num = $('.li5box-ul .li5box-car').length;
  
  // 获取容器宽度作为每个卡片的宽度
  function getSlideWidth() {
    return $('.li5-box').width();
  }
  
  // 设置每个卡片的宽度
  function updateCardsWidth() {
    let width = getSlideWidth();
    $('.li5box-car').css('width', width + 'px');
  }
  
  // 初始化
  updateCardsWidth();
  
  // 窗口大小变化时重新计算
  $(window).resize(function() {
    updateCardsWidth();
    // 重新定位到当前卡片
    let offset = currentIndex * -getSlideWidth();
    $('#li5boxul').css('transform', 'translate3d(' + offset + 'px, 0px, 0px)');
  });

  $('#leftimg').click(function () {
    // 下一个
    if (currentIndex >= num - 1) {
      return false;
    }
    currentIndex++;
    let offset = currentIndex * -getSlideWidth();
    $('#li5boxul').css('transform', 'translate3d(' + offset + 'px, 0px, 0px)');
  })

  $('#rightimg').click(function () {
    // 上一个
    if (currentIndex <= 0) {
      return false;
    }
    currentIndex--;
    let offset = currentIndex * -getSlideWidth();
    $('#li5boxul').css('transform', 'translate3d(' + offset + 'px, 0px, 0px)');
  })


  $('#playbuttom').click(function () {
    $('#zhezhao').addClass('active')
    document.getElementById('videoResumeC').play();
  })

  $('#musicwrap').click(function () {
    console.log(14563)
    if ($(this).hasClass('paused')) {
      $(this).removeClass('paused')
      $('#play1')[0].play()
    } else {
      $(this).addClass('paused')
      $('#play1')[0].pause()
    }
  })


  // //一段正则，匹配所有_min.的图片src属性
	// var test = /_min\./
	// //遍历所有的图片节点
	// $("img").each(function(index,obj){	
	// 	if(test.test($(this).attr("src"))){
	// 		var reSrc = $(this).attr("src").replace(test,".");
	// 		$(this).attr("src",reSrc)
	// 	}		
	// })

})()
