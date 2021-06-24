---
layout: pageA
title: Ideas Archive
permalink: /ideas/
image: 11.jpg
---

This page aims to consolidate all the ideas I would like to work on. There is no guarantee the ideas listed will be completed or even started, however I find it useful to have a place to put these ideas and get me thinking creatively.

***

### OLED Cube <span style="color:green">[In Development]</span>

This project aims to design a cube which faces are comprised of 128x128 RGB OLED displays. These 6 displays and an IMU will be connected to an SoC, resulting in a device which is controlled via it's rotation and or acceleration.

This is not a unique idea, I have seen numerous LED devices that encorporate multiple faces into design, most notibly [Greg Davill](https://gregdavill.com/). However, most of these designs use individual LEDs soldered onto a board to make up one display, this lowers the resolution and increases the size of the design. My design will hopefully shink the device and have a higher resolution, with the tradeoff being larger bezels.

***

### Analogue Keyboard <span style="color:orange">[Researching]</span>

***

### ~~Roundworm Robot~~ <span style="color:red">[Abandoned]</span>

***

### Health Datalogger <span style="color:orange">[Researching]</span>

***

### OpenStreetMaps Sandbox <span style="color:orange">[Researching]</span>


### Headings by default:

# H1 For example
## H2 For example
### H3 For example
#### H4 For example
##### H5 For example
###### H6 For example

{% highlight markdown %}
## Heading first level
### Heading second level
#### Heading third level
{% endhighlight %}

***

### Lists

#### Ordered list example:

1. Poutine drinking vinegar bitters.
2. Coloring book distillery fanny pack.
3. Venmo biodiesel gentrify enamel pin meditation.
4. Jean shorts shaman listicle pickled portland.
5. Salvia mumblecore brunch iPhone migas.

***

#### Unordered list example:

* Bitters semiotics vice thundercats synth.
* Literally cred narwhal bitters wayfarers.
* Kale chips chartreuse paleo tbh street art marfa.
* Mlkshk polaroid sriracha brooklyn.
* Pug you probably haven't heard of them air plant man bun.

{% highlight markdown %}
1. Order list item 1
2. Order list item 1

* Unordered list item 1
* Unordered list item 2
{% endhighlight %}

***

### Table

<div class="table-container">
  <table>
    <tr><th>Header 1</th><th>Header 2</th><th>Header 3</th><th>Header 4</th><th>Header 5</th></tr>
    <tr><td>Row:1 Cell:1</td><td>Row:1 Cell:2</td><td>Row:1 Cell:3</td><td>Row:1 Cell:4</td><td>Row:1 Cell:5</td></tr>
    <tr><td>Row:2 Cell:1</td><td>Row:2 Cell:2</td><td>Row:2 Cell:3</td><td>Row:2 Cell:4</td><td>Row:2 Cell:5</td></tr>
    <tr><td>Row:3 Cell:1</td><td>Row:3 Cell:2</td><td>Row:3 Cell:3</td><td>Row:3 Cell:4</td><td>Row:3 Cell:5</td></tr>
    <tr><td>Row:4 Cell:1</td><td>Row:4 Cell:2</td><td>Row:4 Cell:3</td><td>Row:4 Cell:4</td><td>Row:4 Cell:5</td></tr>
    <tr><td>Row:5 Cell:1</td><td>Row:5 Cell:2</td><td>Row:5 Cell:3</td><td>Row:5 Cell:4</td><td>Row:5 Cell:5</td></tr>
    <tr><td>Row:6 Cell:1</td><td>Row:6 Cell:2</td><td>Row:6 Cell:3</td><td>Row:6 Cell:4</td><td>Row:6 Cell:5</td></tr>
  </table>
</div>

***

### Quotes

#### A quote looks like this:

> Never put off till tomorrow what may be done day after tomorrow just as well. — Mark Twain

***

### Syntax Highlighter

{% highlight js %}
  $('.top').click(function () {
    $('html, body').stop().animate({ scrollTop: 0 }, 'slow', 'swing');
  });
  $(window).scroll(function () {
    if ($(this).scrollTop() > $(window).height()) {
      $('.top').addClass("top-active");
    } else {
      $('.top').removeClass("top-active");
    };
  });
{% endhighlight %}

***

### Images

![]({{site.baseurl}}/img/03.jpg)

***

### Videos

<iframe src="https://www.youtube.com/embed/iWowJBRMtpc" frameborder="0" allowfullscreen></iframe>