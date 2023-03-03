## [7.3.7](https://github.com/makeomatic/mservice-social/compare/v7.3.6...v7.3.7) (2023-03-03)


### Bug Fixes

* **twitter:** filtering with user.id_str instead of user.id ([b8a31d4](https://github.com/makeomatic/mservice-social/commit/b8a31d48830c41ef495c6b391b68da42151f6b90))

## [7.3.6](https://github.com/makeomatic/mservice-social/compare/v7.3.5...v7.3.6) (2023-01-27)


### Bug Fixes

* add special filter for threads of tweets ([2f006aa](https://github.com/makeomatic/mservice-social/commit/2f006aa35248a488cb006db288a83f37330b6ea5))

## [7.3.5](https://github.com/makeomatic/mservice-social/compare/v7.3.4...v7.3.5) (2023-01-18)


### Bug Fixes

* extend logic for reply, add filtering tests ([82c382f](https://github.com/makeomatic/mservice-social/commit/82c382fe63d066cd3a9ad7ab91c37d9a7d57a6e3))
* misc changes ([bfcd770](https://github.com/makeomatic/mservice-social/commit/bfcd770e7adb79c582b947777e336a2fe499ae75))
* **social:** filter accounts param, improve logging ([45c53c8](https://github.com/makeomatic/mservice-social/commit/45c53c8fa2600b2a3138306ddcb1bf8e96833bc9))

## [7.3.4](https://github.com/makeomatic/mservice-social/compare/v7.3.3...v7.3.4) (2023-01-17)


### Bug Fixes

* compute restricted types in statuses ([7380931](https://github.com/makeomatic/mservice-social/commit/73809314f1059d26f51646d6dad17f4077f8ae41))
* migrate status text column to unlimited size ([f25601d](https://github.com/makeomatic/mservice-social/commit/f25601d8315151426d5121ac143ea17818f548b3))
* revert to restricted types calc ([518f173](https://github.com/makeomatic/mservice-social/commit/518f173aca7771852085353f028965255591a8f6))
* use id_str instead of id in filter logs ([097afeb](https://github.com/makeomatic/mservice-social/commit/097afeb11d6eee1746d373423100ba2356eb4cd6))

## [7.3.3](https://github.com/makeomatic/mservice-social/compare/v7.3.2...v7.3.3) (2022-12-12)


### Bug Fixes

* add indexes for statuses: id, account and type ([324ce39](https://github.com/makeomatic/mservice-social/commit/324ce39e698f69e6e0873b6b941d514089ef8550))
* add query condition on restricted tweet types ([d967a7d](https://github.com/makeomatic/mservice-social/commit/d967a7dd619bde1a810b71252d6a3b08aac08408))
* add quote tweet checking ([0e19347](https://github.com/makeomatic/mservice-social/commit/0e193479d3e46de603fe0593eb777e6a4247f7da))
* add quote type to filter options, serialize ([79ae8ab](https://github.com/makeomatic/mservice-social/commit/79ae8abc5de77b620dea3e1a0f46f559c98ff809))
* add schema for requests config ([ced516d](https://github.com/makeomatic/mservice-social/commit/ced516d33e618a2cfc884e80ee702c99fff2c68a))
* add twitter requests config, types enum ([6b656ca](https://github.com/makeomatic/mservice-social/commit/6b656ca6bb73a50f0e33099bcbfb0c9ff4c519a6))
* linter error in migration ([a74a956](https://github.com/makeomatic/mservice-social/commit/a74a956dc1813cdecd78fd30159530381066361b))
* move log to filter ([cb06698](https://github.com/makeomatic/mservice-social/commit/cb06698448a22c9c5f0b68d702e5154935c333c0))
* **notifier:** replace singleton with instance on service ([4b2e33f](https://github.com/makeomatic/mservice-social/commit/4b2e33f3d453d44eac24063c6e359f63d1db2c33))
* switch config to restricted tweet types ([54eedac](https://github.com/makeomatic/mservice-social/commit/54eedacdfdf0728668e1baceb510acbfffbdc22a))
* **twitter:** add hashTags filter, tweet meta data ([9c77ea6](https://github.com/makeomatic/mservice-social/commit/9c77ea6acba1ee8627d1054b1215044cd3239f4b))
* **twitter:** export in twitter utils ([9cc0ee8](https://github.com/makeomatic/mservice-social/commit/9cc0ee802da1192734257fd6477b5df61113a8ee))
* **twitter:** export in twitter utils ([4dfe270](https://github.com/makeomatic/mservice-social/commit/4dfe270180c61a3ae4fc06f995c2bbe11386d4d3))
* **twitter:** types column migration, add test ([d59f56b](https://github.com/makeomatic/mservice-social/commit/d59f56b4e92aa7795e80e1301dc9ab7f4b7bedc7))
* use lowercase for tweet types ([fd37f08](https://github.com/makeomatic/mservice-social/commit/fd37f08b7dfa6d1813f85a71dc509ac6458c5443))

## [7.3.2](https://github.com/makeomatic/mservice-social/compare/v7.3.1...v7.3.2) (2022-11-17)


### Bug Fixes

* add twitter notification config ([d0ed13f](https://github.com/makeomatic/mservice-social/commit/d0ed13f4f0f54ae5d22292931eb42847edb61677))
* linter error ([c7211ae](https://github.com/makeomatic/mservice-social/commit/c7211ae6a4b6497f4e2ed30d1bdd0e4f3eec6370))

## [7.3.1](https://github.com/makeomatic/mservice-social/compare/v7.3.0...v7.3.1) (2022-10-21)


### Bug Fixes

* **tweet-filter:** improve logging for filtering ([6c47daa](https://github.com/makeomatic/mservice-social/commit/6c47daadb4b7f763d53a4d7b52e76f53741d1044))

# [7.3.0](https://github.com/makeomatic/mservice-social/compare/v7.2.3...v7.3.0) (2022-10-03)


### Features

* **twitter:** status filtering by user mentions ([8f84001](https://github.com/makeomatic/mservice-social/commit/8f8400137dc450a17ed1a4a45d0a71869ba3937d))

## [7.2.3](https://github.com/makeomatic/mservice-social/compare/v7.2.2...v7.2.3) (2022-09-10)


### Bug Fixes

* feed read error on incorrect account param ([02b5893](https://github.com/makeomatic/mservice-social/commit/02b5893af2924ed6fc5b7d3189cf1dc9dfb24b6c))
* test assertion ([9407a01](https://github.com/makeomatic/mservice-social/commit/9407a01bb9350290d6abc5a77e1197415c119074))
* update error message ([6f0a46c](https://github.com/makeomatic/mservice-social/commit/6f0a46c912982b5435ffa07059bfbdb2c3f63514))

## [7.2.2](https://github.com/makeomatic/mservice-social/compare/v7.2.1...v7.2.2) (2022-08-29)


### Bug Fixes

* fix update tweet cursor ([fb50707](https://github.com/makeomatic/mservice-social/commit/fb507079e1d0e3654e3100092b6c9dfd3dfd44b4))

## [7.2.1](https://github.com/makeomatic/mservice-social/compare/v7.2.0...v7.2.1) (2022-08-29)


### Bug Fixes

* added debug to save cursor ([0539cbe](https://github.com/makeomatic/mservice-social/commit/0539cbeada960118bea409d3bfe1cd480b459d39))

# [7.2.0](https://github.com/makeomatic/mservice-social/compare/v7.1.0...v7.2.0) (2022-08-23)


### Features

* get tweet count by accounts ([7e99a4f](https://github.com/makeomatic/mservice-social/commit/7e99a4fb01b8d8392b5c0ce578e619685f086fba))

# [7.1.0](https://github.com/makeomatic/mservice-social/compare/v7.0.4...v7.1.0) (2022-08-04)


### Features

* save sync cursor to feed ([#122](https://github.com/makeomatic/mservice-social/issues/122)) ([aa7cd99](https://github.com/makeomatic/mservice-social/commit/aa7cd995ddf307dc55b275fa86d707476c9d2c50))

## [7.0.4](https://github.com/makeomatic/mservice-social/compare/v7.0.3...v7.0.4) (2022-05-16)


### Bug Fixes

* fix notifier debug ([d1e4cba](https://github.com/makeomatic/mservice-social/commit/d1e4cbad7a73fa0cb29bc091d12fe792b82c3015))

## [7.0.3](https://github.com/makeomatic/mservice-social/compare/v7.0.2...v7.0.3) (2022-05-16)


### Bug Fixes

* edit debug logs for tweet sync ([62a25ba](https://github.com/makeomatic/mservice-social/commit/62a25ba266fba13237c75525b193d55445618e3d))

## [7.0.2](https://github.com/makeomatic/mservice-social/compare/v7.0.1...v7.0.2) (2022-05-06)


### Bug Fixes

* increase statuses.text column to 1024 symbols ([#119](https://github.com/makeomatic/mservice-social/issues/119)) ([f895167](https://github.com/makeomatic/mservice-social/commit/f895167a0dabe83a206191010f4b66cbaf017d7d))
* migration compilation error ([#120](https://github.com/makeomatic/mservice-social/issues/120)) ([94d1368](https://github.com/makeomatic/mservice-social/commit/94d1368c952db64ce157caf548d7d83f9c10d9a0))

## [7.0.1](https://github.com/makeomatic/mservice-social/compare/v7.0.0...v7.0.1) (2022-03-29)


### Bug Fixes

* remove prepublishOnly script ([3cb8e3c](https://github.com/makeomatic/mservice-social/commit/3cb8e3c4d4d2f3c76e49278d8324bcffb90594cc))

# [7.0.0](https://github.com/makeomatic/mservice-social/compare/v6.8.3...v7.0.0) (2022-03-29)


### Features

* use latest microfleet, enable health action, pnpm, node 16 ([#114](https://github.com/makeomatic/mservice-social/issues/114)) ([d779fce](https://github.com/makeomatic/mservice-social/commit/d779fce098dbce8a83409b1c99e6e0f89b8d0dc5))


### BREAKING CHANGES

* uses updated configuration for microfleet, underlaying modules had breaking changes, validation error formats have slightly changed (must instead of should, slashes instead of dots). generally no end changes except non-standard configuration for startup needs to be changed. API remains stable

## [6.8.3](https://github.com/makeomatic/mservice-social/compare/v6.8.2...v6.8.3) (2022-01-26)


### Bug Fixes

* **twitter:** add explicit column, index for directly inserted tweets ([#107](https://github.com/makeomatic/mservice-social/issues/107)) ([7e8d018](https://github.com/makeomatic/mservice-social/commit/7e8d018afa06d83d09a0c8ffe5acee87fb9f32d2))

## [6.8.2](https://github.com/makeomatic/mservice-social/compare/v6.8.1...v6.8.2) (2022-01-13)


### Bug Fixes

* increase statuses.text column to 512 symbols ([#105](https://github.com/makeomatic/mservice-social/issues/105)) ([8a5eb73](https://github.com/makeomatic/mservice-social/commit/8a5eb735e20451962f7e18913f4e50ccc74a9a6f))

## [6.8.1](https://github.com/makeomatic/mservice-social/compare/v6.8.0...v6.8.1) (2022-01-12)


### Bug Fixes

* **twitter:** pass tweet_mode to GET requests ([#104](https://github.com/makeomatic/mservice-social/issues/104)) ([08256d6](https://github.com/makeomatic/mservice-social/commit/08256d670f1abb28a4f8816921e3221fe7fd2ae6))

# [6.8.0](https://github.com/makeomatic/mservice-social/compare/v6.7.2...v6.8.0) (2022-01-11)


### Features

* use extended tweets ([#103](https://github.com/makeomatic/mservice-social/issues/103)) ([feeb5aa](https://github.com/makeomatic/mservice-social/commit/feeb5aa795cdb1d13efdeaacda0b49e0da7be3b8))

## [6.7.2](https://github.com/makeomatic/mservice-social/compare/v6.7.1...v6.7.2) (2021-12-30)


### Bug Fixes

* **twitter:** allow case insensitive on register feed ([#102](https://github.com/makeomatic/mservice-social/issues/102)) ([f3e52c4](https://github.com/makeomatic/mservice-social/commit/f3e52c4705a2d96e725c84b590f6799de2bbbf82))

## [6.7.1](https://github.com/makeomatic/mservice-social/compare/v6.7.0...v6.7.1) (2021-12-28)


### Bug Fixes

* **twitter:** throw error on incorrect tweet fetching ([#101](https://github.com/makeomatic/mservice-social/issues/101)) ([31c2eb8](https://github.com/makeomatic/mservice-social/commit/31c2eb81519cef51a59f7bfef8a755ad7a82907b))

# [6.7.0](https://github.com/makeomatic/mservice-social/compare/v6.6.0...v6.7.0) (2021-12-23)


### Features

* **twitter:** add additional props to serialized tweet ([#99](https://github.com/makeomatic/mservice-social/issues/99)) ([ed1ca94](https://github.com/makeomatic/mservice-social/commit/ed1ca94b7d93338ef233fdc50efb198addb99788))

# [6.6.0](https://github.com/makeomatic/mservice-social/compare/v6.5.0...v6.6.0) (2021-11-25)


### Features

* add tweet sync and get endpoints ([#94](https://github.com/makeomatic/mservice-social/issues/94)) ([e0f5df4](https://github.com/makeomatic/mservice-social/commit/e0f5df432f780790bbf6dd409492dcb3042bf84d))

# [6.5.0](https://github.com/makeomatic/mservice-social/compare/v6.4.0...v6.5.0) (2021-04-15)


### Features

* **twitter:** skip filtering for the valid accounts ([#80](https://github.com/makeomatic/mservice-social/issues/80)) ([9c755d0](https://github.com/makeomatic/mservice-social/commit/9c755d08e1f1056e7aab408ea68e992c44dc5565))

# [6.4.0](https://github.com/makeomatic/mservice-social/compare/v6.3.0...v6.4.0) (2021-04-13)


### Features

* filter realtime tweets ([#78](https://github.com/makeomatic/mservice-social/issues/78)) ([0f04485](https://github.com/makeomatic/mservice-social/commit/0f04485a67abd6241aef29de2ae5b104e7bc0e12))

# [6.3.0](https://github.com/makeomatic/mservice-social/compare/v6.2.0...v6.3.0) (2021-04-09)


### Features

* configure user tweets sync ([#74](https://github.com/makeomatic/mservice-social/issues/74)) ([1642e9e](https://github.com/makeomatic/mservice-social/commit/1642e9eaabad03fc7e5fa3f2a5712a5072171a25))

# [6.2.0](https://github.com/makeomatic/mservice-social/compare/v6.1.2...v6.2.0) (2020-05-08)


### Features

* added account column to statuses ([#63](https://github.com/makeomatic/mservice-social/issues/63)) ([456f9d9](https://github.com/makeomatic/mservice-social/commit/456f9d995b6507b3cf389f858d2e440f2247f638))

## [6.1.2](https://github.com/makeomatic/mservice-social/compare/v6.1.1...v6.1.2) (2020-03-27)


### Bug Fixes

* crash on lack of response, latest microfleet version ([#62](https://github.com/makeomatic/mservice-social/issues/62)) ([04f46cc](https://github.com/makeomatic/mservice-social/commit/04f46ccc36bb3d9bff4634487925b4d3e12b8efc))

## [6.1.1](https://github.com/makeomatic/mservice-social/compare/v6.1.0...v6.1.1) (2019-12-09)


### Bug Fixes

* speed up twitter query on multiple accounts ([71baff0](https://github.com/makeomatic/mservice-social/commit/71baff00c8ebd7a46f9a3880c002d798ad482152))

# [6.1.0](https://github.com/makeomatic/mservice-social/compare/v6.0.4...v6.1.0) (2019-12-08)


### Features

* select tweets ignores case, async first-time add ([#58](https://github.com/makeomatic/mservice-social/issues/58)) ([7675c85](https://github.com/makeomatic/mservice-social/commit/7675c85bae2b74e920ee3185101980b93f3ec6f6))

## [6.0.4](https://github.com/makeomatic/mservice-social/compare/v6.0.3...v6.0.4) (2019-11-26)


### Bug Fixes

* do not schedule sync when close called ([d4a905d](https://github.com/makeomatic/mservice-social/commit/d4a905ded3a88167648bcb867885efc316d02984))
* instagram logging, default data ([e987b9d](https://github.com/makeomatic/mservice-social/commit/e987b9d3f7008b5386d8a65afdb627db9138fa3d))

## [6.0.3](https://github.com/makeomatic/mservice-social/compare/v6.0.2...v6.0.3) (2019-11-26)

## [6.0.2](https://github.com/makeomatic/mservice-social/compare/v6.0.1...v6.0.2) (2019-11-26)

## [6.0.1](https://github.com/makeomatic/mservice-social/compare/v6.0.0...v6.0.1) (2019-11-16)


### Bug Fixes

* wrap err array into object ([37d1943](https://github.com/makeomatic/mservice-social/commit/37d1943c81ed03020d79e0863b1d3479766d0f65))

# [6.0.0](https://github.com/makeomatic/mservice-social/compare/v5.0.5...v6.0.0) (2019-11-16)


### Bug Fixes

* update deps ([9141ec1](https://github.com/makeomatic/mservice-social/commit/9141ec18a647aaf893ba5a68088188a4c2594b29))


### Features

* upgrade deps for node 12 and latest [@microfleet](https://github.com/microfleet) ([#54](https://github.com/makeomatic/mservice-social/issues/54)) ([ed2b911](https://github.com/makeomatic/mservice-social/commit/ed2b911c4fae9e622e83ef6f9c0e9b79195eb5e6))


### BREAKING CHANGES

* knex@0.20.x, node 12 as mainline, microfleet/core@15 and so on
public APIs remain stable, but some underlaying configuration has changed so one must be careful to adjust it. overall upgrade time is small

## [5.0.5](https://github.com/makeomatic/mservice-social/compare/v5.0.4...v5.0.5) (2019-03-12)


### Bug Fixes

* **fb:** adhere to 3.1 graph api changes ([#52](https://github.com/makeomatic/mservice-social/issues/52)) ([7ee92d9](https://github.com/makeomatic/mservice-social/commit/7ee92d9))

## [5.0.4](https://github.com/makeomatic/mservice-social/compare/v5.0.3...v5.0.4) (2019-03-11)


### Bug Fixes

* remove inaccessible account ([c3a3185](https://github.com/makeomatic/mservice-social/commit/c3a3185))

## [5.0.3](https://github.com/makeomatic/mservice-social/compare/v5.0.2...v5.0.3) (2019-03-11)


### Bug Fixes

* improved twitter logs ([8b7d99f](https://github.com/makeomatic/mservice-social/commit/8b7d99f))
* invalid handling on fb sync, tw error ([3a101dd](https://github.com/makeomatic/mservice-social/commit/3a101dd))

## [5.0.2](https://github.com/makeomatic/mservice-social/compare/v5.0.1...v5.0.2) (2019-03-11)


### Bug Fixes

* node 10.15.3 ([cdb80b6](https://github.com/makeomatic/mservice-social/commit/cdb80b6))

## [5.0.1](https://github.com/makeomatic/mservice-social/compare/v5.0.0...v5.0.1) (2019-02-18)


### Bug Fixes

* node 10.15.1 ([66050bf](https://github.com/makeomatic/mservice-social/commit/66050bf))

# [5.0.0](https://github.com/makeomatic/mservice-social/compare/v4.5.0...v5.0.0) (2019-02-10)


### Features

* prometheus ([#51](https://github.com/makeomatic/mservice-social/issues/51)) ([70c2bf2](https://github.com/makeomatic/mservice-social/commit/70c2bf2))


### BREAKING CHANGES

* upgrade @microfleet/core to 13.x.x series

# [4.5.0](https://github.com/makeomatic/mservice-social.git/compare/v4.4.6...v4.5.0) (2018-12-26)


### Features

* **tokens:** invalidate ig/fb tokens, sync only valid feeds, add tests ([#50](https://github.com/makeomatic/mservice-social.git/issues/50)) ([b5ee751](https://github.com/makeomatic/mservice-social.git/commit/b5ee751))

## [4.4.6](https://github.com/makeomatic/mservice-social.git/compare/v4.4.5...v4.4.6) (2018-12-24)


### Bug Fixes

* **facebook.media:** add `page.future` param option ([#49](https://github.com/makeomatic/mservice-social.git/issues/49)) ([8ed2516](https://github.com/makeomatic/mservice-social.git/commit/8ed2516))

## [4.4.5](https://github.com/makeomatic/mservice-social.git/compare/v4.4.4...v4.4.5) (2018-12-15)


### Bug Fixes

* **twitter:** add index on account field ([#48](https://github.com/makeomatic/mservice-social.git/issues/48)) ([f24c36f](https://github.com/makeomatic/mservice-social.git/commit/f24c36f))

## [4.4.4](https://github.com/makeomatic/mservice-social.git/compare/v4.4.3...v4.4.4) (2018-12-07)


### Bug Fixes

* logger statemensts ([#47](https://github.com/makeomatic/mservice-social.git/issues/47)) ([1b88681](https://github.com/makeomatic/mservice-social.git/commit/1b88681))

## [4.4.3](https://github.com/makeomatic/mservice-social.git/compare/v4.4.2...v4.4.3) (2018-12-06)


### Bug Fixes

* feed.remove assertion handling, twitter pub only for following accs ([#46](https://github.com/makeomatic/mservice-social.git/issues/46)) ([4616d12](https://github.com/makeomatic/mservice-social.git/commit/4616d12))

## [4.4.2](https://github.com/makeomatic/mservice-social.git/compare/v4.4.1...v4.4.2) (2018-12-04)


### Bug Fixes

* releaserc.json ([#44](https://github.com/makeomatic/mservice-social.git/issues/44)) ([8c20a29](https://github.com/makeomatic/mservice-social.git/commit/8c20a29))
* use timeout.refresh() ([#45](https://github.com/makeomatic/mservice-social.git/issues/45)) ([91f7022](https://github.com/makeomatic/mservice-social.git/commit/91f7022))

## [4.4.1](https://github.com/makeomatic/mservice-social.git/compare/v4.4.0...v4.4.1) (2018-12-04)


### Bug Fixes

* bump deps ([#43](https://github.com/makeomatic/mservice-social.git/issues/43)) ([7be41d6](https://github.com/makeomatic/mservice-social.git/commit/7be41d6))
* releaserc.json ([#44](https://github.com/makeomatic/mservice-social.git/issues/44)) ([8c20a29](https://github.com/makeomatic/mservice-social.git/commit/8c20a29))

## [4.4.1](https://github.com/makeomatic/mservice-social.git/compare/v4.4.0...v4.4.1) (2018-12-04)


### Bug Fixes

* bump deps ([#43](https://github.com/makeomatic/mservice-social.git/issues/43)) ([7be41d6](https://github.com/makeomatic/mservice-social.git/commit/7be41d6))

# [4.4.0](https://github.com/makeomatic/mservice-social.git/compare/v4.3.1...v4.4.0) (2018-12-03)


### Features

* **twitter:** add extended_entities ([#41](https://github.com/makeomatic/mservice-social.git/issues/41)) ([cf80cc1](https://github.com/makeomatic/mservice-social.git/commit/cf80cc1))

## [4.3.1](https://github.com/makeomatic/mservice-social.git/compare/v4.3.0...v4.3.1) (2018-11-30)


### Bug Fixes

* edited user image url ([#40](https://github.com/makeomatic/mservice-social.git/issues/40)) ([36d6ec9](https://github.com/makeomatic/mservice-social.git/commit/36d6ec9))

# [4.3.0](https://github.com/makeomatic/mservice-social.git/compare/v4.2.0...v4.3.0) (2018-11-29)


### Features

* extended feed.read method ([#39](https://github.com/makeomatic/mservice-social.git/issues/39)) ([d69ee39](https://github.com/makeomatic/mservice-social.git/commit/d69ee39))

# [4.2.0](https://github.com/makeomatic/mservice-social.git/compare/v4.1.3...v4.2.0) (2018-11-29)


### Features

* added user image to tweet data ([#38](https://github.com/makeomatic/mservice-social.git/issues/38)) ([6911f81](https://github.com/makeomatic/mservice-social.git/commit/6911f81))

## [4.1.3](https://github.com/makeomatic/mservice-social.git/compare/v4.1.2...v4.1.3) (2018-11-19)


### Bug Fixes

* slightly modified validator config ([#37](https://github.com/makeomatic/mservice-social.git/issues/37)) ([c4167aa](https://github.com/makeomatic/mservice-social.git/commit/c4167aa))

## [4.1.2](https://github.com/makeomatic/mservice-social.git/compare/v4.1.1...v4.1.2) (2018-11-16)


### Bug Fixes

* **twitter:** unify published messages scheme ([#36](https://github.com/makeomatic/mservice-social.git/issues/36)) ([df25d82](https://github.com/makeomatic/mservice-social.git/commit/df25d82))

## [4.1.1](https://github.com/makeomatic/mservice-social.git/compare/v4.1.0...v4.1.1) (2018-10-30)


### Bug Fixes

* custom config via NCONF_FILE_PATH ([#35](https://github.com/makeomatic/mservice-social.git/issues/35)) ([744af80](https://github.com/makeomatic/mservice-social.git/commit/744af80))

# [4.1.0](https://github.com/makeomatic/mservice-social/compare/v4.0.0...v4.1.0) (2018-10-27)


### Features

* add notifier service to broadcast updates of watched entities ([#34](https://github.com/makeomatic/mservice-social/issues/34)) ([60dc679](https://github.com/makeomatic/mservice-social/commit/60dc679))

# [4.0.0](https://github.com/makeomatic/mservice-social/compare/v3.2.0...v4.0.0) (2018-10-04)


### Features

* upgrade all deps ([#33](https://github.com/makeomatic/mservice-social/issues/33)) ([43d2765](https://github.com/makeomatic/mservice-social/commit/43d2765))


### BREAKING CHANGES

* requires node 10, updated semantic-release pipeline
