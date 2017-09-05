/* global $:true, jQuery:true */
/* exported $, jQuery */

/**
 * Collapsible headers, based on Bootstrap's collapse plugin.
 *
 * Invoke with: $('body').addCollapsibleSections()
 *
 * TODO:
 *
 * - Require bootstrap as a dependency: require('bootstrap').
 * - Divide code into HTML pass and JavaScript pass:
 *   HTML pass should add Bootstrap attributes to headers,
 *   JavaScript pass should add click handlers.
 *   (perhaps JS could be replaced with CSS' :before/:after?).
 * - Should the JavaScript pass be performed automatically?
 *   I.e., $(function () { ... }). Or will this cause problems
 *   if the code is used as a Node plugin?
 * - Does the code style of Bootstrap's plugin provide any clues
 *   with regard to best practice?
 * - Add code for collapsible lists.
 * - Make links to collapsed elements auto-expand them
 * - Option like Pandoc's --section-divs
 *   (or does this belong in a plugin of its own?)
 */

$ = $ || require('jquery')
var S = require('string')
jQuery = $ // needed for Bootstrap
require('bootstrap')

var collapse = {}

collapse.unique = function (fn) {
  var results = []
  return function (arg) {
    var result = fn(arg)
    if (results.indexOf(result.valueOf()) >= 0) {
      var i = 1
      var newresult = ''
      do {
        i++
        newresult = result + '-' + i
      } while (results.indexOf(newresult.valueOf()) >= 0)
      result = newresult
    }
    results.push(result.valueOf())
    return result
  }
}

collapse.generateId = function (el, prefix) {
  prefix = prefix || ''
  return prefix + S(el.text().trim()).slugify()
}

collapse.generateUniqueId = collapse.unique(collapse.generateId)

collapse.addCollapsibleLists = function (options) {
  return this.each(function () {
    var body = $(this)
    body.find('ul > li').each(function (i, el) {
      var li = $(this)
      var ul = li.find('> ol, > ul').first()
      if (ul.length > 0) {
        var prev = li.clone()
        prev.find('ol, ul').remove()
        var listId = collapse.generateUniqueId(prev)
        li.attr('id', listId + '-item')
        collapse.addButton(li, ul, true, listId + '-list')
      } else {
        var id = collapse.generateUniqueId(li) + '-item'
        var button = collapse.button(id)
        button.removeAttr('aria-controls data-toggle role')
        li.attr('id', id)
        li.prepend(button)
      }
      var list = li.parent()
      if (!list.hasClass('collapse')) {
        list.addClass('collapse in')
      }
    })
  })
}

collapse.addCollapsibleSections = function (options) {
  var opts = $.extend({}, collapse.defaults, options)
  return this.each(function () {
    var body = $(this)
    // process innermost sections first
    $.each(['h6', 'h5', 'h4', 'h3', 'h2', 'h1'],
           function (i, el) {
             body.find(el).each(function () {
               // add section
               var header = $(this)
               var section = collapse.addSection(header)

               // skip top-level headers
               if ($.inArray(el, opts.include) < 0) {
                 return
               }

               // add button to header
               collapse.addButton(header, section)
             })
           })
  })
}

// add collapsible content for header
collapse.addSection = function (header) {
  // h1 ends at next h1, h2 ends at next h1 or h2,
  // h3 ends at next h1, h2 or h3, and so on
  var stop = []
  var i = parseInt(header.prop('tagName').match(/\d+/)[0])

  for (var j = 1; j <= i; j++) {
    stop.push('h' + j)
  }
  var end = stop.join(', ')
  var section = header.nextUntil(end)
  section = section.wrapAll('<div>').parent()
  collapse.sectionId(header, section)
  return section
}

// add button to header
collapse.addButton = function (header, section, prepend, sectionId) {
  // add button
  var id = sectionId
  if (id) {
    section.attr('id', id)
  } else {
    id = collapse.sectionId(header, section)
  }
  var button = collapse.button(id)
  if (prepend) {
    header.prepend(button)
  } else {
    header.append(button)
  }

  // add Bootstrap classes
  section.addClass('collapse in')

  // allow pre-collapsed sections
  if (header.hasClass('collapse')) {
    header.removeClass('collapse').addClass('collapsed')
  }
  if (header.hasClass('collapsed')) {
    header.removeClass('collapsed')
    section.removeClass('in')
    button.attr('aria-expanded', 'false')
  }
}

// button
collapse.button = function (id) {
  return $('<a aria-hidden="true" aria-expanded="true" role="button" class="collapse-button" data-toggle="collapse" href="#' + id + '" aria-controls="' + id + '"></a>')
}

// header ID (add if missing)
collapse.headerId = function (header) {
  var id = header.attr('id')
  if (id === undefined || id === '') {
    id = collapse.generateUniqueId(header)
    header.attr('id', id)
  }
  return id
}

// section ID (based on header ID)
collapse.sectionId = function (header, section) {
  var id = section.attr('id')
  if (id === undefined || id === '') {
    var headerId = collapse.headerId(header)
    id = headerId ? headerId + '-section' : ''
    section.attr('id', id)
  }
  return id
}

// Default options
collapse.defaults = {
  include: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
}

$.fn.addCollapsibleSections = collapse.addCollapsibleSections
$.fn.addCollapsibleLists = collapse.addCollapsibleLists
$.fn.addCollapsibleSections.addSection = collapse.addSection
$.fn.addCollapsibleSections.addButton = collapse.addButton
$.fn.addCollapsibleSections.button = collapse.button
$.fn.addCollapsibleSections.headerId = collapse.headerId
$.fn.addCollapsibleSections.sectionId = collapse.sectionId
$.fn.addCollapsibleSections.defaults = collapse.defaults

module.exports = collapse
