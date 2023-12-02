// https://www.yoheim.net/blog.php?q=20190902
// * * * * * （起動したい処理）
// | | | | |
// | | | | |- 曜日
// | | | |--- 月
// | | |----- 日
// | |------- 時
// |--------- 分
// https://crontab.guru/every-1-hour

export const EVERY_MINUTE               = "* * * * *";
export const EVERY_HOUR_AT_0MINUTE      = "0 * * * *";
export const EVERY_DAY_AT_0HOUR_0MINUTE = "0 0 * * *";

export const EVERY_2MINUTES = "*/2 * * * *";
export const EVERY_10MINUTES = "*/10 * * * *";