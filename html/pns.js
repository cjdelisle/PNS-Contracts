/*@flow*/

/*::
const { ethers } = require('hardhat');
export type Var_t<X> = {|
    get: () => X,
    update: (...$ReadOnlyArray<any>) => Promise<?X>,
    updateAndSet: (...$ReadOnlyArray<any>) => Promise<?X>,
    setter: ((X) => ?Promise<void>) => void,
    makeDefault: () => void,
    isDefault: () => boolean,
|};

export type UnitType_t = "Cjdns"|"Cjdns+Vpn"|"Private Cjdns"|"Vpn"|"Domain"|"Nameserver"|"Route Server";

// Define the type for the unit object in the "units" array
type Unit_t = {
    id: string,
    name: string,
    t: UnitType_t,
    assigned_credits: string,
    assigned_credits_dollarized: string,
    status_ok: boolean,
    week_uptime: number,
    bonus: number|null,
    penalty: number|null,
    daily_yield: string,
};

// Define the main type for the overall structure
type Data_t = {
    total_yc: string,
    assigned_yc: string,
    five_thousand_usd_yc: string,
    daily_per_million_cjdns: string,
    daily_per_million_domain: string,
    units: Array<Unit_t>, // Array of Unit objects
};

type DataProvider_t = {
  get: () => Data_t,
  update: () => Promise<Data_t>,
  availableYc: () => bigint,
};

type RespCjdnsBonus_t = {
  ip_block: string,
  ip_block_nodes: number,
  ip_block_bonus: number,
  asn: string,
  asn_nodes: number,
  asn_bonus: number,
  ipv6_bonus: number,
  total_bonus: number,
};
type RespCjdnsSim_t = {
  bonus: RespCjdnsBonus_t,
  applicable_yield_credits: string,
  dollarized_yield_credits: string,
  effective_yield_credits: string,
  daily_yield: string,
  daily_yield_dollarized: string,
};
type InfraCjdnsStatusOperational_t = {
  ipv4: string,
  bonus: RespCjdnsBonus_t,
  uptime: number,
  downtime_penalty: number,
  effective_yield_credits: string, // Assuming U256 is a big integer or hexadecimal string
  daily_yield: string,
  daily_yield_dollarized: string,
};
type InfraCjdnsStatus_t = {
  name: string,
  domain: string,
  vpn: boolean,
  private: boolean,
  assigned_yield_credits: string, // Assuming U256 is a big integer or hexadecimal string
  dollarized_yield_credits: string,
  node_status: string,
  peer_id: string,
  operational_status: ?InfraCjdnsStatusOperational_t, // Optional field
};


/// --- ///

export type Admin_t = {
    owner: Var_t<string>,
    admin: Var_t<string>,
    priceHalving: Var_t<number>,
    whitelistActive: Var_t<boolean>,
    whitelist: Var_t<string>,
    queryWhitelist: (addr: string) => Promise<?void>,
    updateOwner: (no: string) => Promise<?void>, 
    updateAdmin: (no: string) => Promise<?void>,
    updateWhitelist: (
        address: string,
        toAdd: boolean,
        enable: boolean
    ) => Promise<?void>,
    updatePriceHalvingSeconds: (number) => Promise<?void>,
    updateDomainBlacklisted: (string, boolean) => Promise<?void>,
    trustContract: (string, boolean) => Promise<?void>,
};
export type UnitTableEnt_t = {
    id: string,
    name: string,
    t: UnitType_t,
    assignedCredits: string,
    assignedCreditsDollarized: string,
    statusOk: boolean,
    weekUptime: number,
    bonus: number|null,
    penalty: number|null,
    dailyYield: string,
};
export type DomainUpdateOrCreate_t = {|
    tldOptions: Var_t<string[]>,
    createButtonActive: Var_t<boolean>,
    domain: Var_t<string>,
    resolveDangerous: Var_t<boolean>,
    yieldCreditsValidation: Var_t<string>,
    yieldCreditsDollarized: Var_t<string>,
    yieldCredits: Var_t<number>,
    clickMaxCreditsButton: () => Promise<void>,
    createOrUpdate: () => Promise<?void>,
    setNodeId: (?string) => Promise<void>,
|};
export type CjdnsSim_t = {|
    ipv4Address: Var_t<string>,
    hasIpv6: Var_t<boolean>,
    ipv4AddressValidationError: Var_t<string>,
    addressBlockNodes: Var_t<string>,
    addressBlockBonus: Var_t<string>,
    addressBlockNetwork: Var_t<string>,
    ispNetwork: Var_t<string>,
    ispNodes: Var_t<string>,
    ispBonus: Var_t<string>,
    ipv6Bonus: Var_t<string>,
    totalBonus: Var_t<string>,
|};
export type CjdnsUpdateOrCreate_t = {|
    domainOptions: Var_t<{[string]:string}>,
    createButtonActive: Var_t<boolean>,
    nodeNameValidation: Var_t<string>,
    yieldCreditsValidation: Var_t<string>,
    yieldCreditsDollarized: Var_t<string>,
    yieldCredits: Var_t<number>,
    name: Var_t<string>,
    domain: Var_t<string>,
    clickMaxCreditsButton: () => Promise<void>,
    enableVPN: Var_t<boolean>,
    privateNode: Var_t<boolean>,
    createOrUpdate: () => Promise<void|null>,
    setNodeId: (?string) => Promise<void>,
    nodeStatus: Var_t<string>,
    publicIpv4: Var_t<string>,
    peerId: Var_t<string>,

    addressBlockNodes: Var_t<string>,
    addressBlockBonus: Var_t<string>,
    addressBlockNetwork: Var_t<string>,
    ispNetwork: Var_t<string>,
    ispNodes: Var_t<string>,
    ispBonus: Var_t<string>,
    ipv6Bonus: Var_t<string>,
    totalBonus: Var_t<string>,

    reliabilityPercent: Var_t<number>,
    downtimePenalty: Var_t<string>,
    effectiveYieldCredits: Var_t<string>,
    yieldPerMillionCredits: Var_t<string>,
    currentDailyYieldDollarized: Var_t<string>,
    currentDailyYield: Var_t<string>,

    setupNodeUrl: Var_t<string>,
    nodeIsSetup: Var_t<boolean>,
|};
export type Infra_t = {|
    assignedYc: Var_t<string>,
    totalYc: Var_t<string>,
    cjdnsDailyPerMillion: Var_t<string>,
    domainDailyPerMillion: Var_t<string>,
    unitTable: Var_t<UnitTableEnt_t[]>,
    createUpdateCjdns: () => Promise<CjdnsUpdateOrCreate_t>,
    createUpdateDomain: () => Promise<DomainUpdateOrCreate_t>,
    infraCjdnsSim: () => Promise<CjdnsSim_t>,
|};
export type Pns_t = {|
    setErrorHandler: ((Error)=>void)=>void,
    setTxidHandler: ((string)=>void)=>void,
    admin: () => Promise<Admin_t>,
    infra: () => Promise<Infra_t>,
|};
export type PnsConstructor_t = (any) => Promise<Pns_t>;
*/

const PNS /*:PnsConstructor_t*/ = window.PNS = (() => {
    const API_SERVER = 'https://app.pkt.cash/beta/api/v1';
    const CJDNS_HOWTO = 'https://docs.pkt.cash/infra/cjdns-node/';

    let self_myAddress;
    let self_pnsContract;
    let self_infraContract;
    let self_assignContract;
    let self_provider;
    let self_signer;
    let self_errorHandler = (err /*:Error*/, source /*:string*/) => {
        alert("Error: " + String(err) + " from: " + source);
    };
    let self_txidHandler = (txn /*:string*/) => { console.log("Got transaction: " + txn); };

    const renderPKT = (n /*:string|bigint|number*/) => {
        const twoDec = (n /*:string*/) => n.replace(/\.([0-9])$/, (_, hundths) => `.0${hundths}`);
        const bn = BigInt(n);
        const cents = bn / 10n ** 16n;
        if (cents === 0n) {
            if (bn === 0n) {
            return '0.00';
            }
            // 0.00000000112233455 -> 0.0000000011
            return ethers.formatEther(bn).replace(/^([0\.]*[0-9]{0,2})[0-9]*$/,(_,a)=>a)
        }
        const rem = bn - cents * 10n ** 16n;
        if (rem > 5n * 10n ** 15n || (rem === 5n * 10n ** 15n && cents % 2n !== 0n)) {
            return twoDec(((cents + 1n) / 100n).toLocaleString('en-US') + '.' + ((cents + 1n) % 100n).toString());
        }
        return twoDec((cents / 100n).toLocaleString('en-US') + '.' + (cents % 100n).toString());
    };

    const validNodeName = (name /*:string*/) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(name);

    const errorHandled = function errorHandled/*::<Args: $ReadOnlyArray<any>, R: any>*/(
        name /*:string*/,
        f /*:(...Args) => ?Promise<R>*/
    ) /*:(...Args) => Promise<R|null>*/ {
        return async (...args) => {
            try {
                const out = await f(...args);
                if (typeof(out) === 'undefined') { return null; }
                return out;
            } catch (error) {
                console.error("Error in " + name + ":", error);
                self_errorHandler(error, name);
                return null;
            }
        };
    };

    const mkVar = async /*::<T>*/(
        name /*:string*/,
        valueProvider /*:(...$ReadOnlyArray<any>) => Promise<T>*/,
        dependencies /*:?Var_t<any>[]*/
    ) /*:Promise<Var_t<T>>*/ => {
        let val/*:T*/ = await valueProvider();
        let defaultVal/*:T*/ = val;
        const vp = errorHandled(name, valueProvider);
        let set/*:(T)=>Promise<void|null>*/ = async (_x/*:T*/) => {};
        const update = async (...x /*:any*/) => {
            const v = await vp(...x);
            if (v !== null) {
                val = v;
            }
            if (dependencies) {
                dependencies.forEach((d) => d.updateAndSet());
            }
            return val;
        };
        return Object.freeze({
            get: () => val,
            update,
            updateAndSet: async (...x) => {
                await update(...x);
                set(val);
                return val;
            },
            makeDefault: () => { defaultVal = val; },
            isDefault: () => defaultVal === val,
            setter: (s /*:(T) => ?Promise<void>*/) => {
                set = errorHandled(name, s);
                set(val);
            }
        });
    };

    const admin = async () /*:Promise<Admin_t>*/ => {
        const owner = await mkVar("admin.owner", async () => await self_pnsContract.owner());
        const admin = await mkVar("admin.admin", async () => await self_pnsContract.getAdmin());
        const priceHalving = await mkVar("admin.priceHalving", async () =>
            (await self_pnsContract.getMinLockupInfo()).priceHalvingPeriodSeconds);
        const whitelistActive = await mkVar("admin.whitelistActive", async () =>
            await self_pnsContract.isRegistrationWhitelistActive());

        const whitelist = await mkVar("admin.whitelist", async (x /*:?string*/) => x || '');
        const queryWhitelist = errorHandled('pns.queryWhitelist', async (addressToCheck /*:string*/) => {
            whitelist.updateAndSet("Checking...");
            if (whitelistActive.get()) {
                const isWhitelisted = await self_pnsContract.isAddressWhitelisted(addressToCheck);
                whitelist.updateAndSet(isWhitelisted ? "Whitelisted" : "Not Whitelisted");
            } else {
                whitelist.updateAndSet("Whitelist Inactive");
            }
        });

        const updateWhitelist = errorHandled('admin.updateWhitelist', async (
            address /*:string*/,
            toAdd /*:boolean*/,
            enable /*:boolean*/
        ) => {
            const allowedAddresses = [{ addr: address, allowed: toAdd }];
            const tx = await self_pnsContract.updateRegistrationWhitelist(allowedAddresses, enable);
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
            await queryWhitelist(address);
        });

        const updatePriceHalvingSeconds = errorHandled('admin.updatePriceHalvingSeconds', async (sec /*:number*/) => {
            const tx = await self_pnsContract.setPriceHalvingSeconds(sec);
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
        });

        const updateDomainBlacklisted = errorHandled('admin.updateDomainBlacklisted', async (
            did /*:string*/,
            bl /*:boolean*/
        ) => {
            const tx = await self_pnsContract.setDomainBlacklisted(did, bl);
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
        });

        const updateOwner = errorHandled('admin.updateOwner', async (addr /*:string*/) => {
            const tx = await self_pnsContract.transferOwnership(addr);
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
        });

        const updateAdmin = errorHandled('admin.updateAdmin', async (addr /*:string*/) => {
            const tx = await self_pnsContract.setAdmin(addr);
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
        });

        const trustContract = errorHandled('admin.trustContract', async (addr /*:string*/, trust /*:boolean*/) => {
            const tx = await self_infraContract.trustContract(addr, trust);
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
        });

        return Object.freeze({
            owner,
            admin,
            priceHalving,
            whitelistActive,
            whitelist,
            queryWhitelist,
            updateOwner,
            updateAdmin,
            updateWhitelist,
            updatePriceHalvingSeconds,
            updateDomainBlacklisted,
            trustContract,
        });
    };

    const withDefault = /*::<T>*/(defaultVal/*:T*/, callback /*:?()=>void*/) /*:(t:T|void)=>Promise<T>*/ => {
        return async (arg) => {
            if (typeof(arg) === 'undefined') { return defaultVal; }
            if (callback) { callback(); }
            return arg;
        };
    };

    const yieldCredits = async (
        name /*:string*/,
        dataProv /*:DataProvider_t*/,
        createButtonActive /*:Var_t<boolean>*/,
        limit /*:?bigint*/,
        limitDollars /*:?string*/
    ) => {
        let assignedYieldCredits /*:bigint|null*/ = 0n;
        let yieldCreditsOk = true;
        const yieldCreditsValidation = await mkVar(name + ".yieldCreditsValidation", async () => {
            let msg = '';
            yieldCreditsOk = false;
            if (assignedYieldCredits === null) {
                msg = "Invalid number.";
            } else if (assignedYieldCredits > 0n && assignedYieldCredits > dataProv.availableYc()) {
                msg = "You don't have enough yield credits to assign.";
            } else if (assignedYieldCredits && limit && assignedYieldCredits > limit) {
                msg = `Only $${limitDollars || 'UNDEFINED'} of Yield Credits are allowed.`;
            } else {
                yieldCreditsOk = true;
            }
            return msg;
        }, [createButtonActive]);
        const yieldCreditsDollarized = await mkVar(name + ".yieldCreditsDollarized", async () => {
            if (assignedYieldCredits === null) {
                return "-";
            }
            return renderPKT(assignedYieldCredits * 10n**18n * 5000n / BigInt(dataProv.get().five_thousand_usd_yc));
        });
        const yieldCredits = await mkVar(name + ".yieldCredits", async (yc) => {
            if (typeof(yc) === 'string') { yc = yc.replace(/,/g, ''); }
            const n = Number(yc || 0);
            if (isNaN(n)) {
                console.log('yc set to null because yc is', yc);
                assignedYieldCredits = null;
            } else {
                assignedYieldCredits = BigInt(Math.floor(n * 10**18));
            }
            if (assignedYieldCredits !== null && assignedYieldCredits > 0n) {
                return Number(assignedYieldCredits) / 10**18;
            } else {
                return 0;
            }
        }, [yieldCreditsDollarized, yieldCreditsValidation, createButtonActive]);
        const clickMaxCreditsButton = async () => {
            let amt = dataProv.availableYc();
            if (limit && limit < amt) {
                amt = limit;
            }
            await yieldCredits.updateAndSet(Number(amt) / 10**18);
        };
        return Object.freeze({
            get: () => assignedYieldCredits,
            isOk: () => yieldCreditsOk,
            yieldCreditsValidation,
            yieldCreditsDollarized,
            yieldCredits,
            clickMaxCreditsButton,
        });
    };

    const infraCreateCjdns = async (
        dataProv /*:DataProvider_t*/,
    ) /*:Promise<CjdnsUpdateOrCreate_t>*/ => {
        let nodeName = '';
        let nodeNameOk = true;
        let nodeId /*:?string*/ = null;
        let isDefault = () => true;
        let yieldCreditsOk = () => true;

        const createButtonActive = await mkVar("infra.createCjdns.createButtonActive", async () => {
            return !isDefault() && nodeNameOk && yieldCreditsOk();
        });

        const nodeNameValidation = await mkVar("infra.createCjdns.nodeNameValidation", async () => {
            nodeNameOk = nodeName === '' || validNodeName(nodeName);
            return (nodeNameOk) ? "" : "Only allowed letters and numbers (with dashes between)";
        }, [createButtonActive]);
        const name = await mkVar("infra.createCjdns.nodeName", (n) => {
            nodeName = n;
            return n;
        }, [nodeNameValidation]);
        const domain = await mkVar("infra.createCjdns.domain", withDefault('0x0'), [createButtonActive]);
        const enableVPN = await mkVar("infra.createCjdns.enableVPN", withDefault(false), [createButtonActive]);
        const privateNode = await mkVar("infra.createCjdns.privateNode", withDefault(false), [createButtonActive]);

        const nodeStatus = await mkVar("infra.createCjdns.nodeStatus", withDefault(''));
        const publicIpv4 = await mkVar("infra.createCjdns.publicIpv4", withDefault(''));
        const peerId = await mkVar("infra.createCjdns.peerId", withDefault(''));

        const addressBlockNodes = await mkVar("infra.createCjdns.addressBlockNodes", withDefault('-'));
        const addressBlockBonus = await mkVar("infra.createCjdns.addressBlockBonus", withDefault('-'));
        const addressBlockNetwork = await mkVar("infra.createCjdns.addressBlockNetwork", withDefault('-'));
        
        const ispNetwork = await mkVar("infra.createCjdns.ispNetwork", withDefault('-'));
        const ispNodes = await mkVar("infra.createCjdns.ispNodes", withDefault('-'));
        const ispBonus = await mkVar("infra.createCjdns.ispBonus", withDefault('-'));
        
        const ipv6Bonus = await mkVar("infra.createCjdns.ipv6Bonus", withDefault('-'));
        
        const totalBonus = await mkVar("infra.createCjdns.totalBonus", withDefault('-'));

        const reliabilityPercent = await mkVar("infra.createCjdns.reliabilityPercent", withDefault(0));
        const downtimePenalty = await mkVar("infra.createCjdns.downtimePenalty", withDefault('-'));
        const effectiveYieldCredits = await mkVar("infra.createCjdns.effectiveYieldCredits", withDefault('-'));
        const yieldPerMillionCredits = await mkVar("infra.createCjdns.yieldPerMillionCredits", withDefault('-'));
        const currentDailyYieldDollarized = await mkVar("infra.createCjdns.currentDailyYieldDollarized", withDefault('-'));
        const currentDailyYield = await mkVar("infra.createCjdns.currentDailyYield", withDefault('-'));
        const setupNodeUrl = await mkVar("infra.createCjdns.setupNodeUrl", withDefault(CJDNS_HOWTO));
        const nodeIsSetup = await mkVar("infra.createCjdns.nodeIsSetup", withDefault(false));

        const yc = await yieldCredits(
            'infra.createCjdns',
            dataProv,
            createButtonActive,
            BigInt(dataProv.get().five_thousand_usd_yc),
            "5,000"
        );
        yieldCreditsOk = yc.isOk;

        const getType = () => {
            if (enableVPN.get()) {
                if (privateNode.get()) {
                    return 2; // Vpn 2
                } else {
                    return 3; // CjdnsVpn 3
                }
            } else {
                if (privateNode.get()) {
                    return 4; // PrivateCjdns 4
                } else {
                    return 1; // Cjdns 1
                }
            }
        };

        const domainOptions = await mkVar("infra.createCjdns.domainOptions", async () => {
            // TODO: get your domain names so you can select one
            return ({
                "0x0": "no-name.pkt",
            } /*:{[string]:string}*/);
        });

        isDefault = () => {
            if (!nodeId) {
            } else if (!name.isDefault()) {
            } else if (!domain.isDefault()) {
            } else if (!enableVPN.isDefault()) {
            } else if (!privateNode.isDefault()) {
            } else if (!yc.yieldCredits.isDefault()) {
            } else {
                return true;
            }
            return false;
        };

        const setNodeId = async (id /*:?string*/) => {
            nodeId = id;

            addressBlockNodes.updateAndSet('-');
            addressBlockBonus.updateAndSet('-');
            addressBlockNetwork.updateAndSet('-');
            ispNetwork.updateAndSet('-');
            ispNodes.updateAndSet('-');
            ispBonus.updateAndSet('-');
            ipv6Bonus.updateAndSet('-');
            totalBonus.updateAndSet('-');

            reliabilityPercent.updateAndSet(0);
            downtimePenalty.updateAndSet('-');
            effectiveYieldCredits.updateAndSet('-');
            yieldPerMillionCredits.updateAndSet('-');
            currentDailyYieldDollarized.updateAndSet('-');
            currentDailyYield.updateAndSet('-');

            if (id) {
                const data = dataProv.get();
                const unit = data.units.find((u)=>u.id === nodeId);
                if (!unit) { return; }
                await name.updateAndSet(unit.name + '');
                await domain.updateAndSet('0x0') // TODO
                await enableVPN.updateAndSet(unit.t.indexOf('Vpn') > -1);
                await privateNode.updateAndSet(unit.t === 'Vpn' || unit.t === 'Private Cjdns');
                await yc.yieldCredits.updateAndSet(Number(unit.assigned_credits) / 10**18);
                name.makeDefault();
                domain.makeDefault();
                enableVPN.makeDefault();
                privateNode.makeDefault();
                yc.yieldCredits.makeDefault();
                createButtonActive.updateAndSet();

                nodeStatus.updateAndSet('');
                publicIpv4.updateAndSet('');
                peerId.updateAndSet('');

                errorHandled('infra.createCjdns.setNodeId.fetch', async () => {
                    const r = await fetch(`${API_SERVER}/infra/cjdns/${id}`);
                    const res /*:InfraCjdnsStatus_t*/ = await r.json();
                    nodeStatus.updateAndSet(res.node_status);
                    if (res.operational_status) {
                        const resp = res.operational_status;
                        publicIpv4.updateAndSet(resp.ipv4);

                        addressBlockNodes.updateAndSet(resp.bonus.ip_block_nodes.toString());
                        addressBlockBonus.updateAndSet(percent(resp.bonus.ip_block_bonus));
                        addressBlockNetwork.updateAndSet(resp.bonus.ip_block);
                        ispNetwork.updateAndSet(resp.bonus.asn);
                        ispNodes.updateAndSet(resp.bonus.asn_nodes.toString());
                        ispBonus.updateAndSet(percent(resp.bonus.asn_bonus));
                        ipv6Bonus.updateAndSet(resp.bonus.ipv6_bonus ? percent(resp.bonus.ipv6_bonus) : '-');
                        totalBonus.updateAndSet((resp.bonus.total_bonus > 0 ? '+' : '') + percent(resp.bonus.total_bonus));

                        reliabilityPercent.updateAndSet(Math.floor(resp.uptime * 100));
                        downtimePenalty.updateAndSet(Math.floor(resp.downtime_penalty * 100) + '%');
                        effectiveYieldCredits.updateAndSet(renderPKT(resp.effective_yield_credits));
                        yieldPerMillionCredits.updateAndSet(renderPKT(dataProv.get().daily_per_million_cjdns));
                        currentDailyYieldDollarized.updateAndSet(renderPKT(resp.daily_yield_dollarized));
                        currentDailyYield.updateAndSet(renderPKT(resp.daily_yield)); 
                        nodeIsSetup.updateAndSet(true);           
                    } else {
                        publicIpv4.updateAndSet('NOT FOUND');
                        nodeIsSetup.updateAndSet(false);
                    }
                    peerId.updateAndSet(res.peer_id);
                    setupNodeUrl.updateAndSet(CJDNS_HOWTO + '?peer_id=' + res.peer_id);
                })();
            } else {
                await name.updateAndSet('');
                await domain.updateAndSet('0x0') // TODO
                await enableVPN.updateAndSet(false);
                await privateNode.updateAndSet(false);
                await yc.yieldCredits.updateAndSet(0);
                name.makeDefault();
                domain.makeDefault();
                enableVPN.makeDefault();
                privateNode.makeDefault();
                yc.yieldCredits.makeDefault();
                createButtonActive.updateAndSet();
            }
        };

        const createOrUpdate = errorHandled('infra.cjdns.createOrUpdate', async () => {
            let tx;
            if (nodeId) {
                tx = await self_assignContract.updateAndAssign(
                    nodeId,
                    0b111,
                    getType(),
                    domain.get(),
                    name.get(),
                    '0x' + (yc.get() || 0n).toString(16)
                );
            } else {
                tx = await self_assignContract.registerAndAssign(
                    getType(),
                    domain.get(),
                    name.get(),
                    '0x' + (yc.get() || 0n).toString(16),
                    self_myAddress,
                );
            }
            const txr = await tx.wait();
            const waitReq = await fetch(API_SERVER + '/wait/' + txr.hash);
            const waitRes = await waitReq.json();
            console.log(waitRes);
            await dataProv.update();
            self_txidHandler(txr.hash);
        });

        return Object.freeze({
            domainOptions,
            createButtonActive,
            nodeNameValidation,
            yieldCreditsValidation: yc.yieldCreditsValidation,
            yieldCreditsDollarized: yc.yieldCreditsDollarized,
            yieldCredits: yc.yieldCredits,
            clickMaxCreditsButton: yc.clickMaxCreditsButton,
            name,
            domain,
            enableVPN,
            privateNode,
            createOrUpdate,
            setNodeId,
            nodeStatus,
            publicIpv4,
            peerId,

            addressBlockNodes,           // Var_t<string>
            addressBlockBonus,           // Var_t<string>
            addressBlockNetwork,         // Var_t<string>
            ispNetwork,                  // Var_t<string>
            ispNodes,                    // Var_t<string>
            ispBonus,                    // Var_t<string>
            ipv6Bonus,                   // Var_t<string>
            totalBonus,                   // Var_t<string>

            reliabilityPercent,
            downtimePenalty,
            effectiveYieldCredits,
            yieldPerMillionCredits,
            currentDailyYieldDollarized,
            currentDailyYield,
            setupNodeUrl,
            nodeIsSetup,
        });
    };

    const infraCreateDomain = async (
        dataProv /*:DataProvider_t*/,
    ) /*:Promise<DomainUpdateOrCreate_t>*/ => {
        let domainSet = () => false;
        let nodeId /*:?string*/ = null;
        let isDefault = () => true;
        let yieldCreditsOk = () => true;        

        const tldOptions = await mkVar("infra.createCjdns.domainOptions", async () => {
            // TODO: Get all domain names
            return ["com","org","net"];
        });

        const createButtonActive = await mkVar("infra.createDomain.createButtonActive", async () => {
            return (!nodeId || !isDefault()) && (nodeId || domainSet()) && yieldCreditsOk();
        });
        const domain = await mkVar("infra.createDomain.domain", withDefault(''), [createButtonActive]);
        domainSet = () => domain.get() !== '';
        const resolveDangerous = await mkVar("infra.createDomain.resolveDangerous",
                withDefault(false), [createButtonActive]);
        const yc = await yieldCredits('infra.createDomain', dataProv, createButtonActive);
        yieldCreditsOk = yc.isOk;

        setInterval(() => {
            console.log(domainSet(), domain.get());
        }, 1000);

        const createOrUpdate = errorHandled('infra.createDomain.createOrUpdate', async () => {
            let tx;
            // DomainDangerous = 6
            // Domain = 5
            const t = resolveDangerous.get() ? 6 : 5;
            if (nodeId) {
                tx = await self_assignContract.updateAndAssign(
                    nodeId,
                    0b111,
                    t,
                    '0x0',
                    domain.get(),
                    '0x' + (yc.get() || 0n).toString(16)
                );
            } else {
                console.log('self_assignContract.registerAndAssign(',
                    t,
                    '0x0',
                    domain.get(),
                    '0x' + (yc.get() || 0n).toString(16),
                    self_myAddress,
                ')');
                tx = await self_assignContract.registerAndAssign(
                    t,
                    '0x0',
                    domain.get(),
                    '0x' + (yc.get() || 0n).toString(16),
                    self_myAddress,
                );
            }
            const txr = await tx.wait();
            const waitReq = await fetch(API_SERVER + '/wait/' + txr.hash);
            const waitRes = await waitReq.json();
            console.log(waitRes);
            await dataProv.update();
            self_txidHandler(txr.hash);
        });

        const setNodeId = async (n /*:?string*/) => {
            nodeId = n;
            await createButtonActive.updateAndSet();
        };

        return Object.freeze({
            tldOptions,
            createButtonActive,
            domain,
            resolveDangerous,
            yieldCreditsValidation: yc.yieldCreditsValidation,
            yieldCreditsDollarized: yc.yieldCreditsDollarized,
            yieldCredits: yc.yieldCredits,
            clickMaxCreditsButton: yc.clickMaxCreditsButton,
            createOrUpdate,
            setNodeId,
        });
    };

    const isValidIpv4 = (ipv4 /*:string*/) /*:boolean*/ => {
        const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipv4Regex.test(ipv4);
    };

    const percent = (num /*:number*/) /*:string*/ => `${Math.floor(num * 100)}%`;

    const infraCjdnsSim = async () /*:Promise<CjdnsSim_t>*/ => {
        const ipv4Address = await mkVar("infra.cjdnsSim.ipv4Address", withDefault(''));
        const hasIpv6 = await mkVar("infra.cjdnsSim.hasIpv6", withDefault(false));
        const ipv4AddressValidationError = await mkVar("infra.cjdnsSim.ipv4AddressValidationError", withDefault(''));
        
        const addressBlockNodes = await mkVar("infra.cjdnsSim.addressBlockNodes", withDefault('-'));
        const addressBlockBonus = await mkVar("infra.cjdnsSim.addressBlockBonus", withDefault('-'));
        const addressBlockNetwork = await mkVar("infra.cjdnsSim.addressBlockNetwork", withDefault('-'));
        
        const ispNetwork = await mkVar("infra.cjdnsSim.ispNetwork", withDefault('-'));
        const ispNodes = await mkVar("infra.cjdnsSim.ispNodes", withDefault('-'));
        const ispBonus = await mkVar("infra.cjdnsSim.ispBonus", withDefault('-'));
        
        const ipv6Bonus = await mkVar("infra.cjdnsSim.ipv6Bonus", withDefault('-'));
        
        const totalBonus = await mkVar("infra.cjdnsSim.totalBonus", withDefault('-'));

        let v4 = '';
        let hasV6 = false;
        const cycle /*:(?boolean)=>void*/ = (execute) => {
            if (ipv4Address.get() === v4 && hasIpv6.get() === hasV6) {
                return void setTimeout(cycle, 100);
            }
            if (!isValidIpv4(ipv4Address.get())) {
                addressBlockNodes.updateAndSet('-');
                addressBlockBonus.updateAndSet('-');
                addressBlockNetwork.updateAndSet('-');
                ispNetwork.updateAndSet('-');
                ispNodes.updateAndSet('-');
                ispBonus.updateAndSet('-');
                ipv6Bonus.updateAndSet('-');
                totalBonus.updateAndSet('-');
                ipv4AddressValidationError.updateAndSet('Must be a valid ipv4 address such as 1.2.3.4');
                return void setTimeout(cycle, 100);
            }
            ipv4AddressValidationError.updateAndSet('');
            if (execute) {
                const lv4 = ipv4Address.get();
                const lv6 = hasIpv6.get();
                errorHandled('infra.cjdnsSim.fetch', async () => {
                    const r = await fetch(`${API_SERVER}/infra/cjdns/yield-sim/${lv4}/${lv6.toString()}/0x0`);
                    const resp /*:RespCjdnsSim_t*/ = await r.json();
                    console.log(JSON.stringify(resp, null, '\t'));
                    v4 = lv4;
                    hasV6 = lv6;
                    addressBlockNodes.updateAndSet(resp.bonus.ip_block_nodes.toString());
                    addressBlockBonus.updateAndSet(percent(resp.bonus.ip_block_bonus));
                    addressBlockNetwork.updateAndSet(resp.bonus.ip_block);
                    ispNetwork.updateAndSet(resp.bonus.asn);
                    ispNodes.updateAndSet(resp.bonus.asn_nodes.toString());
                    ispBonus.updateAndSet(percent(resp.bonus.asn_bonus));
                    ipv6Bonus.updateAndSet(resp.bonus.ipv6_bonus ? percent(resp.bonus.ipv6_bonus) : '-');
                    totalBonus.updateAndSet((resp.bonus.total_bonus > 0 ? '+' : '') + percent(resp.bonus.total_bonus));
                    cycle();
                })();
            } else {
                totalBonus.updateAndSet('Loading...');
                setTimeout(() => cycle(true), 3000);
            }
        };
        cycle();

        return {
            ipv4Address,                // Var_t<string>
            hasIpv6,                    // Var_t<boolean>
            ipv4AddressValidationError,  // Var_t<string>
            addressBlockNodes,           // Var_t<string>
            addressBlockBonus,           // Var_t<string>
            addressBlockNetwork,         // Var_t<string>
            ispNetwork,                  // Var_t<string>
            ispNodes,                    // Var_t<string>
            ispBonus,                    // Var_t<string>
            ipv6Bonus,                   // Var_t<string>
            totalBonus                   // Var_t<string>
        };        
    };

    const infra = async () /*:Promise<Infra_t>*/ => {
        let data /*:Data_t*/;
        const updateData = async () => {
            const dataReq = await fetch(API_SERVER + '/infra/main/' + self_myAddress);
            data = Object.freeze(await dataReq.json());
        };
        await updateData();

        const availableYc = () => BigInt(data.total_yc) - BigInt(data.assigned_yc);
        const assignedYc = await mkVar("infra.assignedYc", async () => {
            if (availableYc() < 0n) {
                return `${renderPKT(data.assigned_yc)} OVER LIMIT`;
            } else {
                return renderPKT(data.assigned_yc);
            }
        });
        const totalYc = await mkVar("infra.totalYc", async () => renderPKT(data.total_yc));
        const cjdnsDailyPerMillion = await mkVar("infra.cjdnsDailyPerMillion", async () =>
            renderPKT(data.daily_per_million_cjdns));
        const domainDailyPerMillion = await mkVar("infra.domainDailyPerMillion", async () =>
            renderPKT(data.daily_per_million_domain));

        const unitTable = await mkVar("infra.unitTable", async () =>
            data.units.map((u) => ({
               id: u.id,
               name: u.name,
               t: u.t,
               assignedCredits: renderPKT(u.assigned_credits),
               assignedCreditsDollarized: renderPKT(u.assigned_credits_dollarized),
               statusOk: u.status_ok,
               weekUptime: u.week_uptime,
               bonus: u.bonus,
               penalty: u.penalty,
               dailyYield: renderPKT(u.daily_yield),
            }))
        );

        const dataProv/*:DataProvider_t*/ = Object.freeze({
            get: () => data,
            update: async () => {
                await updateData();
                await assignedYc.updateAndSet();
                await totalYc.updateAndSet();
                await cjdnsDailyPerMillion.updateAndSet();
                await domainDailyPerMillion.updateAndSet();
                await unitTable.updateAndSet();
                return data;
            },
            availableYc,
        });

        return Object.freeze({
            assignedYc,
            totalYc,
            cjdnsDailyPerMillion,
            domainDailyPerMillion,
            unitTable,
            createUpdateCjdns: async () => await infraCreateCjdns(dataProv),
            createUpdateDomain: async () => await infraCreateDomain(dataProv),
            infraCjdnsSim: async () => await infraCjdnsSim(),
        });
    };
    
    return async (provider) => {
        self_provider = provider;
        const signer = self_signer = await provider.getSigner();
        self_myAddress = await signer.getAddress();

        console.log("Signer Address Is", self_myAddress);

        // Load your contract ABI and address
        const pnsAbi = await (await fetch('./PNS.json')).json();
        const infraAbi = await (await fetch('./Infra.json')).json();
        const assignAbi = await (await fetch('./Assign.json')).json();

        // Initialize the contract
        self_pnsContract = new ethers.Contract(
            '0xDd0c3FE1a3cac20209e808FB2dB61D15ABB5b6dD',
            pnsAbi,
            signer
        );

        self_infraContract = new ethers.Contract(
            '0xFDc0c296A6DafBA5D43af49ffC08741d197B7485',
            infraAbi,
            signer
        );

        self_assignContract = new ethers.Contract(
            '0xd8cEDc7550da84E2CaDa058802e71aB041d67651',
            assignAbi,
            signer
        );

        return Object.freeze({
            setErrorHandler: (eh) => self_errorHandler = eh,
            setTxidHandler: (tx) => self_txidHandler = tx,
            admin,
            infra,
        });
    };
})();