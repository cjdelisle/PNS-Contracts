window.PNS = (() => {
    const API_SERVER = 'https://app.pkt.cash/beta/api/v1';

    let self_myAddress;
    let self_pnsContract;
    let self_infraContract;
    let self_assignContract;
    let self_provider;
    let self_signer;
    let self_errorHandler = (err) => { alert("Error: " + err); };
    let self_txidHandler = (txn) => { console.log("Got transaction: " + txn); };

    const renderPKT = (n) => {
        const twoDec = (n) => n.replace(/\.([0-9])$/, (_, hundths) => `.0${hundths}`);
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
            return twoDec(((cents + 1n) / 100n).toLocaleString('en-US') + '.' + ((cents + 1n) % 100n));
        }
        return twoDec((cents / 100n).toLocaleString('en-US') + '.' + (cents % 100n));
    };

    const validNodeName = (name) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(name);

    const errorHandled = function errorHandled(name, f) {
        return async (...args) => {
            try {
                return await f(...args);
            } catch (error) {
                console.error("Error in " + name + ":", error);
                self_errorHandler(error, name);
                return null, error;
            }
        };
    };

    const mkVar = async (name, valueProvider) => {
        const vp = errorHandled(name, valueProvider);
        let val = await vp();
        let set = () => {};
        return Object.freeze({
            get: () => val,
            update: async (...x) => {
                val = await vp(...x);
                set(val);
                return val;
            },
            setter: (s) => {
                set = errorHandled(name, s);
                set(val);
            }
        });
    };

    const admin = async () => {
        const owner = await mkVar("pns.owner", async () => await self_pnsContract.owner());
        const admin = await mkVar("pns.admin", async () => await self_pnsContract.getAdmin());
        const priceHalving = await mkVar("pns.priceHalving", async () =>
            (await self_pnsContract.getMinLockupInfo()).priceHalvingPeriodSeconds);
        const whitelistActive = await mkVar("pns.whitelistActive", async () =>
            await self_pnsContract.isRegistrationWhitelistActive());

        const whitelist = await mkVar("pns.whitelist", async (x) => x || '');
        const queryWhitelist = errorHandled('pns.queryWhitelist', async (addressToCheck) => {
            whitelist.update("Checking...");
            if (whitelistActive.get()) {
                const isWhitelisted = await self_pnsContract.isAddressWhitelisted(addressToCheck);
                whitelist.update(isWhitelisted ? "Whitelisted" : "Not Whitelisted");
            } else {
                whitelist.update("Whitelist Inactive");
            }
        });

        const updateWhitelist = errorHandled('pns.updateWhitelist', async (address, toAdd, enable) => {
            const allowedAddresses = [{ addr: address, allowed: toAdd }];
            const tx = await self_pnsContract.updateRegistrationWhitelist(allowedAddresses, enable);
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
            await queryWhitelist(address);
        });

        const updatePriceHalvingSeconds = errorHandled('pns.updatePriceHalvingSeconds', async (sec) => {
            const tx = await self_pnsContract.setPriceHalvingSeconds(sec);
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
        });

        const updateDomainBlacklisted = errorHandled('pns.updateDomainBlacklisted', async (did, bl) => {
            const tx = await self_pnsContract.setDomainBlacklisted(did, bl);
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
        });

        const updateOwner = errorHandled('pns.updateOwner', async (addr) => {
            const tx = await self_pnsContract.transferOwnership(addr);
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
        });

        const updateAdmin = errorHandled('pns.updateAdmin', async (addr) => {
            const tx = await self_pnsContract.setAdmin(newAdmin);
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
        });
    };

    const infraCreateCjdns = async (data, availableYc) => {
        let nodeName = '';
        let nodeNameOk = true;

        let enableVPN = false;
        let privateCjdns = false;

        let assignedYieldCredits = 0n;
        let yieldCreditsOk = true;

        let domainSelection = '0x0';

        const getType = () => {
            if (enableVPN) {
                if (privateCjdns) {
                    return 2; // Vpn 2
                } else {
                    return 3; // CjdnsVpn 3
                }
            } else {
                if (privateCjdns) {
                    return 4; // PrivateCjdns 4
                } else {
                    return 1; // Cjdns 1
                }
            }
        };

        const domainOptions = await mkVar("infra.createCjdns.domainOptions", () => {
            // TODO: get your domain names so you can select one
            return {
                "0x0": "no-name.pkt",
            };
        });

        const createButtonActive = await mkVar("infra.createCjdns.createButtonActive", () => {
            return nodeNameOk && yieldCreditsOk;
        });
        const nodeNameValidation = await mkVar("infra.createCjdns.nodeNameValidation", () => {
            nodeNameOk = validNodeName(nodeName);
            createButtonActive.update();
            return (nodeNameOk) ? "" : "Node name can only contain letters, numbers and dash";
        });
        const yieldCreditsValidation = await mkVar("infra.createCjdns.yieldCreditsValidation", () => {
            let msg = '';
            yieldCreditsOk = false;
            if (assignedYieldCredits === null) {
                msg = "Invalid number.";
            } else if (assignedYieldCredits > 0n && assignedYieldCredits > availableYc) {
                msg = "You don't have enough yield credits to assign.";
            } else if (assignedYieldCredits > BigInt(data.five_thousand_usd_yc)) {
                msg = "Only $5,000 of Yield Credits are allowed.";
            } else {
                yieldCreditsOk = true;
            }
            createButtonActive.update();
            return msg;
        });
        const yieldCreditsDollarized = await mkVar("infra.createCjdns.yieldCreditsDollarized", () => {
            if (assignedYieldCredits === null) {
                return "-";
            }
            return renderPKT(assignedYieldCredits * 5000n / BigInt(data.five_thousand_usd_yc));
        });
        const updateYieldCredits = (yc) => {
            const n = Number(yc);
            if (isNaN(n)) {
                assignedYieldCredits = null;
            } else {
                assignedYieldCredits = BigInt(Math.floor(n * 10**18));
            }
            yieldCreditsDollarized.update();
            yieldCreditsValidation.update();
        };
        const updateNodeName = (nn) => {
            nodeName = nn;
            nodeNameValidation.update();
        };
        const updateDomainSelection = (id) => {
            domainSelection = id;
        };
        const clickMaxCreditsButton = () => {
            const max = BigInt(data.five_thousand_usd_yc)
            const available = availableYc;
            assignedYieldCredits = (max > available) ? available : max;
            yieldCreditsDollarized.update();
            yieldCreditsValidation.update();
        };
        const updateEnableVpn = (checked) => {
            enableVPN = checked;
        };
        const updatePrivateCjdns = (checked) => {
            privateCjdns = checked;
        };
        const create = async () => {
            const tx = await self_assignContract.registerAndAssign(
                getType(),
                domainSelection,
                nodeName,
                assignedYieldCredits,
                self_myAddress,
            );
            const txr = await tx.wait();
            self_txidHandler(txr.hash);
        };
        return {
            domainOptions,
            createButtonActive,
            nodeNameValidation,
            yieldCreditsValidation,
            yieldCreditsDollarized,
            updateYieldCredits,
            updateNodeName,
            updateDomainSelection,
            clickMaxCreditsButton,
            updateEnableVpn,
            updatePrivateCjdns,
            create,
        }
    }

    const infra = async () => {
        const dataReq = await fetch(API_SERVER + '/infra/main/' + self_myAddress);
        let data = await dataReq.json();
        const availableYc = () => BigInt(data.total_yc) - BigInt(data.assigned_yc);
        const assignedYc = await mkVar("infra.assignedYc", () => {
            if (availableYc() < 0) {
                return `${renderPKT(data.assigned_yc)} OVER LIMIT`;
            } else {
                return renderPKT(data.assigned_yc);
            }
        });
        const totalYc = await mkVar("infra.totalYc", () => renderPKT(data.total_yc));
        const cjdnsDailyPerMillion = await mkVar("infra.cjdnsDailyPerMillion", () =>
            renderPKT(data.daily_per_million_cjdns));
        const domainDailyPerMillion = await mkVar("infra.domainDailyPerMillion", () =>
            renderPKT(data.daily_per_million_domain));

        return Object.freeze({
            assignedYc,
            totalYc,
            cjdnsDailyPerMillion,
            domainDailyPerMillion,
            createCjdns: async () => await infraCreateCjdns(data, availableYc()),
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
            '0xdC7632FcE40bd0738d7b1C1c94589A7c88beC369',
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