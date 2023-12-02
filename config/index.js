module.exports = {
  // 因为我的日记模块里有每年今日，所以做一个批量替换用
  eachYearDay:
    "\n```dataviewjs\nconst full_date = dv.current().file.name // 获取当前文件名\nconst num_date = dv.current().file.name.replace(/-/g, '') // 获取当前文件名，去掉 - ，用来匹配时间戳格式的文件名\n// console.log('full_date', num_date)\nconst date = full_date.slice(-5) // 获取 mm-dd\n// console.log('date', date)\nconst allFiles = dv.pages('\"journals\" or \"memos\" or \"我的笔记\"').filter(file => {\n  // console.log('file', file.file.name)\n  return (\n    (file.file.name.indexOf(date) !== -1 || file.file.name.indexOf(num_date) !== -1) &&\n    file.file.name !== full_date\n  )\n})\nif (allFiles.length) {\n  dv.header(4, '每年今日')\n}\ndv.list(allFiles.file.link)\n```\n"
}
