/** /*:
 * @target MZ
 * 
 * @author Savroheim
 * 
 * @plugindesc Enable inventory limit and barter system 
 * 
 * @help
 * 
 * CAUTION !
 * This plugin affect : 
 * 1. Scene_Equip
 * 2. Scene_Item
 * 3. Scene_Shop
 * 4. Scene_Message (select item event)
 * 5. Scene_Battle (will skip item drop)
 * 
 * ---------------------------------
 * | item, weapon, armor notetag : |
 * ---------------------------------
 * <weight:2>
 * 
 * 
 * ##############################
 * # Available Plugin Command : #
 * ##############################
 * 
 * 1. Create Loot Chest
 * Use this to define loot chest (and its content).
 * Loot id 0 is reserved for battle loot and drop zone 
 * (don't define loot id 0 ).
 * 
 * 2. Open Loot Chest
 * open defined loot chest (don't open loot id 0).
 * 
 * 3. Check Available Space
 * use this before npc give player an item.
 * if player inventory doesn't have enough space for
 * that item (define needed space), scene barter (drop)
 * will triggered.
 *  
 *  
 * 
 * @param InventoryLimit
 * @type number
 * @text Inventory Limit
 * @default 100
 * 
 * @param IconIndex
 * @type number
 * @text Icon Index
 * @default 209 
 * 
 * @param WeightUnit
 * @type text
 * @text Weight Unit
 * @default WP
 * @desc default WP (Weight Point)
 * 
 * @command lootChest
 * @text Loot Chest
 * @desc Create Loot Chest 
 * 
 * @arg lootId
 * @type number
 * @text loot Id
 * 
 * @arg lootName
 * @type text
 * @text loot Name
 *
 * @arg iconIndex
 * @type number
 * @text icon index
 * @default 210
 * 
 * @arg lootLimit
 * @type number
 * @text loot limit
 * @default 0
 * 
 * @arg allowKeyItem
 * @type boolean
 * @text allow key item
 * @default false
 *  
 * @arg items
 * @type struct<addItem>[]
 * @text Items
 * 
 * @arg weapons
 * @type struct<addWeapon>[]
 * @text Weapons
 * 
 * @arg armors
 * @type struct<addArmor>[]
 * @text Armors
 * 
 * @command lootOpen
 * @text Loot Open
 * @desc Open Loot Chest 
 * 
 * @arg lootId
 * @type number
 * @text loot Id
 * 
 * @command checkAvailableSpace
 * @text check space
 * @desc Check Available Space
 * 
 * @arg neededSpace
 * @type number
 * @text needed space
 * 
 */

/*~struct~addItem:
 * @param itemId
 * @text item
 * @type item
 * 
 * @param amount
 * @text amount
 * @type number
 * 
 * 
 */

/*~struct~addWeapon:
 * @param weaponId
 * @text weapon
 * @type weapon
 * 
 * @param amount
 * @text amount
 * @type number
 * 
 * 
 */

/*~struct~addArmor:
 * @param armorId
 * @text armor
 * @type armor
 * 
 * @param amount
 * @text amount
 * @type number
 * 
 * 
 */
 (function(){


    let params = PluginManager.parameters("SVR_InventoryBarter");

// #################################################################################
// PLUGIN COMMAND
// #################################################################################
 

    PluginManager.registerCommand("SVR_InventoryBarter", "lootChest", args =>{

        $gameSystem._inventoryBarter.newLoot(
            Number(args.lootId),
            Number(args.lootLimit),
            String(args.lootName),
            Number(args.iconIndex),
            (args.allowKeyItem == "true") ? true : false);

        let items = (args.items) ? JSON.parse(args.items) : null;

        if(items){

            items.forEach(function(item){
                item = JSON.parse(item);
                $gameSystem._inventoryBarter.gainLoot(Number(args.lootId),$dataItems[Number(item.itemId)],Number(item.amount))
            });
        }

        let weapons = (args.weapons) ? JSON.parse(args.weapons) : null;

        if(weapons){

            weapons.forEach(function(weapon){
                weapon = JSON.parse(weapon);
                $gameSystem._inventoryBarter.gainLoot(Number(args.lootId),$dataWeapons[Number(weapon.weaponId)],Number(weapon.amount))
            });
        }

        let armors = (args.armors) ? JSON.parse(args.armors) : null;

        if(armors){

            armors.forEach(function(armor){
                armor = JSON.parse(armor);
                $gameSystem._inventoryBarter.gainLoot(Number(args.lootId),$dataArmors[Number(armor.armorId)],Number(armor.amount))
            });
        }
    });

    PluginManager.registerCommand("SVR_InventoryBarter", "lootOpen", args =>{
        let lootId = Number(args.lootId);
        $gameSystem._inventoryBarter._lootId = lootId;
        SceneManager.push(Scene_Barter);
    });

    PluginManager.registerCommand("SVR_InventoryBarter", "checkAvailableSpace", args =>{
        const currentWeight = $gameSystem._inventoryBarter.currentInventoryWeight();
        const limit = $gameSystem._inventoryBarter._inventoryLimit;
        if(Number(args.neededSpace) + currentWeight > limit){
            $gameSystem._inventoryBarter.newLoot(0,0,"Drop Inventory to : " + (limit - Number(args.neededSpace)),16,false);
            $gameSystem._inventoryBarter._lootId = 0;
            $gameSystem._inventoryBarter.lootChest()._isDropZone = true;
            $gameSystem._inventoryBarter.lootChest()._dropTarget = limit - Number(args.neededSpace);
            SceneManager.push(Scene_Barter);

        }
    });


// #################################################################################
// REGISTER NEW GAME SYSTEM OBJECT
// #################################################################################

    const _Game_System_Initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function(){
        _Game_System_Initialize.apply(this,arguments);

        this._inventoryBarter = new NE_Barter();
        this._inventoryBarter._inventoryLimit = Number(params.InventoryLimit);
        this._inventoryBarter._iconIndex = Number(params.IconIndex);
        this._inventoryBarter._weightUnit = String(params.WeightUnit);
    }

 })();


// #################################################################################
// NOOB ENGINEER BARTER
// #################################################################################
//
// class to control inventory barter system
//

function NE_Barter() {
    this.initialize(...arguments);
}

NE_Barter.prototype = Object.create(Object.prototype);
NE_Barter.prototype.constructor = NE_Barter;

NE_Barter.prototype.initialize = function () {
    
    this._lootId = 0;
    this._inventoryLimit = 0;
    this._iconIndex = 0;
    this._weightUnit = "";


    this._lootChest = [];

    this.newLoot(0,0,"Battle Loot",208,false);
};

NE_Barter.prototype.newLoot = function (lootId, lootLimit, lootName, iconIndex, allowKeyItem){
    this._lootChest[lootId] ={
        '_items' : {},
        '_weapons' : {},
        '_armors' : {},
        '_lastItem' : new Game_Item(),
        '_lootLimit' : lootLimit,
        '_lootName' : lootName,
        '_allowKeyItem' : allowKeyItem,
        '_iconIndex' : iconIndex,
        '_isDropZone' : false,
        '_dropTarget' : 0
    };
}

NE_Barter.prototype.lootChest = function(){
    return this._lootChest[this._lootId];
}

NE_Barter.prototype.gainLoot = function (lootId,item,amount){
    const container = this.lootContainer(lootId,item);
    if (container) {
        const lastNumber = this.numLoots(lootId,item);
        const newNumber = lastNumber + amount;
        container[item.id] = newNumber.clamp(0, 99);
        if (container[item.id] === 0) {
            delete container[item.id];
        }
        $gameMap.requestRefresh();
    }
}

NE_Barter.prototype.loseLoot = function(lootId,item,amount){
    this.gainLoot(lootId,item,-amount);
}

NE_Barter.prototype.numLoots = function (lootId,item){
    const container = this.lootContainer(lootId,item);
    return container ? container[item.id] || 0 : 0;
}


NE_Barter.prototype.items = function () {
     let lootId = this._lootId;
    return Object.keys(this._lootChest[lootId]._items).map(id => $dataItems[id]);
}

NE_Barter.prototype.weapons = function () {
    let lootId = this._lootId;
    return Object.keys(this._lootChest[lootId]._weapons).map(id => $dataWeapons[id]);
}

NE_Barter.prototype.armors = function () {
    let lootId = this._lootId;
    return Object.keys(this._lootChest[lootId]._armors).map(id => $dataArmors[id]);
}

NE_Barter.prototype.equipItems = function () {
    return this.weapons().concat(this.armors());
}

NE_Barter.prototype.allItems = function () {
    return this.items().concat(this.equipItems());
}

NE_Barter.prototype.lootContainer = function(lootId,item){
    if (!item) {
        return null;
    } else if (DataManager.isItem(item)) {
        return this._lootChest[lootId]._items;
    } else if (DataManager.isWeapon(item)) {
        return this._lootChest[lootId]._weapons;
    } else if (DataManager.isArmor(item)) {
        return this._lootChest[lootId]._armors;
    } else {
        return null;
    }
}

NE_Barter.prototype.lastItem = function(){
    return this._lootChest[this._lootId]._lastItem.object();
}

NE_Barter.prototype.setLastItem = function(item){
    this._lootChest[this._lootId]._lastItem.setObject(item);
}

NE_Barter.prototype.currentInventoryWeight = function(){
    let weight = 0;
    $gameParty.allItems().forEach(function(item){
        if(item){
            weight += (item.meta.weight) ? (Number(item.meta.weight)*$gameParty.numItems(item)) : 0;
        }
    });
    return weight;
}

NE_Barter.prototype.currentLootWeight = function(){
    let weight = 0;
    const NEBarter = this;
    this.allItems().forEach(function(item){
        if(item){
            weight += (item.meta.weight) ? (Number(item.meta.weight)*NEBarter.numLoots(NEBarter._lootId,item)) : 0;
        }
    });
    return weight;
}

NE_Barter.prototype.menuActorEquipWeight = function(){
    let weight = 0;
    $gameParty.menuActor().equips().forEach(function(equip){
        if(equip){
            weight += (equip.meta.weight) ? Number(equip.meta.weight) : 0;
        }
    });
    return weight;
};


// #################################################################################
// WINDOW INVENTORY CATEGORY
// #################################################################################
//
// window that extends Window_ItemCategory capabilities
//

function Window_InventoryCategory() {
    this.initialize(...arguments);
}

Window_InventoryCategory.prototype = Object.create(Window_ItemCategory.prototype);
Window_InventoryCategory.prototype.constructor = Window_InventoryCategory;

Window_InventoryCategory.prototype.initialize = function(rect) {
    Window_ItemCategory.prototype.initialize.call(this, rect);
    this._lootWindow = {};
};

Window_InventoryCategory.prototype.maxCols = function() {
    return 4;
};

Window_InventoryCategory.prototype.setLootWindow = function(lootWindow){
    this._lootWindow = lootWindow;
};

Window_InventoryCategory.prototype.update = function() {
    Window_HorzCommand.prototype.update.call(this);
    if (!this._lootWindow.isOpenAndActive()) {
        this._itemWindow.setCategory(this.currentSymbol());
    }
};

Window_InventoryCategory.prototype.processCancel = function() {
    if($gameSystem._inventoryBarter.lootChest()._isDropZone && $gameSystem._inventoryBarter.currentInventoryWeight() > $gameSystem._inventoryBarter.lootChest()._dropTarget){
        SoundManager.playBuzzer();
    }else{
        SoundManager.playCancel();
        this.updateInputData();
        this.deactivate();
        this.callCancelHandler();
    }
};

// #################################################################################
// WINDOW INVENTORY LIST
// #################################################################################
//
// window that extends Window_ItemList capabilities
//

function Window_InventoryList() {
    this.initialize(...arguments);
}

Window_InventoryList.prototype = Object.create(Window_ItemList.prototype);
Window_InventoryList.prototype.constructor = Window_InventoryList;

Window_InventoryList.prototype.maxCols = function(){
    return 1;
};

Window_InventoryList.prototype.isEnabled = function(item){
    if(item){
        let weightCondition = ($gameSystem._inventoryBarter.lootChest()._lootLimit == 0) ? true : (Number(item.meta.weight)+$gameSystem._inventoryBarter.currentLootWeight() <= $gameSystem._inventoryBarter.lootChest()._lootLimit);
        let keyItemCondition = (DataManager.isItem(item) && item.itypeId === 2) ? $gameSystem._inventoryBarter.lootChest()._allowKeyItem : true;
        return !($gameSystem._inventoryBarter.numLoots($gameSystem._inventoryBarter._lootId,item) === 99 ) && weightCondition && keyItemCondition;
    }else{
        return false;
    }
}

Window_InventoryList.prototype.processHandling = function(){
    Window_Selectable.prototype.processHandling.call(this);

    if(this.isOpenAndActive()){

        if (this.isHandled("right") && Input.isTriggered("right")) {
            this.playCursorSound();
            return this.callHandler("right");
        }
    }
}

Window_InventoryList.prototype.processPagedown = function(){
    Window_Selectable.prototype.processPagedown.call(this);
    this.playCursorSound();
};


Window_InventoryList.prototype.updateTone = function(){

    if(this.active){
        this.setTone(0,0,0);
    }else{
        this.setTone(-100,-100,-100);
    }

};


// #################################################################################
// WINDOW LOOT LIST
// #################################################################################
//
// window to list loot item
//

function Window_LootList() {
    this.initialize(...arguments);
}

Window_LootList.prototype = Object.create(Window_Selectable.prototype);
Window_LootList.prototype.constructor = Window_LootList;

Window_LootList.prototype.initialize = function(rect) {
    Window_Selectable.prototype.initialize.call(this, rect);
    this._category = "none";
    this._data = [];
};

Window_LootList.prototype.setCategory = function(category) {
    if (this._category !== category) {
        this._category = category;
        this.refresh();
        this.scrollTo(0, 0);
    }
};

Window_LootList.prototype.maxCols = function() {
    return 1;
};

Window_LootList.prototype.colSpacing = function() {
    return 16;
};

Window_LootList.prototype.maxItems = function() {
    return this._data ? this._data.length : 1;
};

Window_LootList.prototype.item = function() {
    return this.itemAt(this.index());
};

Window_LootList.prototype.itemAt = function(index) {
    return this._data && index >= 0 ? this._data[index] : null;
};

Window_LootList.prototype.isCurrentItemEnabled = function() {
    return this.isEnabled(this.item());
};

Window_LootList.prototype.includes = function(item) {
	switch (this._category) {
        case "item":
            return DataManager.isItem(item) && item.itypeId === 1;
        case "weapon":
            return DataManager.isWeapon(item);
        case "armor":
            return DataManager.isArmor(item);
        case "keyItem":
            return DataManager.isItem(item) && item.itypeId === 2;
        default:
            return true;
    }
};

Window_LootList.prototype.needsNumber = function() {
    if (this._category === "keyItem") {
        return $dataSystem.optKeyItemsNumber;
    } else {
        return true;
    }
};

Window_LootList.prototype.isEnabled = function(item) {
    if(item){

        return !$gameParty.hasMaxItems(item) && (Number(item.meta.weight)+$gameSystem._inventoryBarter.currentInventoryWeight() <= $gameSystem._inventoryBarter._inventoryLimit);
    }else{
        return false;
    }
};

Window_LootList.prototype.makeItemList = function() {
    this._data = $gameSystem._inventoryBarter.allItems().filter(item => this.includes(item));
};

Window_LootList.prototype.selectLast = function() {
    const index = this._data.indexOf($gameSystem._inventoryBarter.lastItem());
    this.forceSelect(index >= 0 ? index : 0);
};

Window_LootList.prototype.drawItem = function(index) {
    const item = this.itemAt(index);
    if (item) {
        const numberWidth = this.numberWidth();
        const rect = this.itemLineRect(index);
        this.changePaintOpacity(this.isEnabled(item));
        this.drawItemName(item, rect.x, rect.y, rect.width - numberWidth);
        this.drawItemNumber(item, rect.x, rect.y, rect.width);
        this.changePaintOpacity(1);
    }
};

Window_LootList.prototype.numberWidth = function() {
    return this.textWidth("000");
};

Window_LootList.prototype.drawItemNumber = function(item, x, y, width) {
	let needsNumber = (DataManager.isItem(item) && item.itypeId === 2) ? $dataSystem.optKeyItemsNumber : true;
    let lootId = $gameSystem._inventoryBarter._lootId;
    if (needsNumber) {
        this.drawText(":", x, y, width - this.textWidth("00"), "right");
        this.drawText($gameSystem._inventoryBarter.numLoots(lootId,item), x, y, width, "right");
    }
};

Window_LootList.prototype.updateHelp = function() {
    this.setHelpWindowItem(this.item());
};

Window_LootList.prototype.refresh = function() {
    this.makeItemList();
    Window_Selectable.prototype.refresh.call(this);
};

Window_LootList.prototype.processHandling = function(){
    Window_Selectable.prototype.processHandling.call(this);

    if(this.isOpenAndActive()){

        if (this.isHandled("left") && Input.isTriggered("left")) {
            this.playCursorSound();
            return this.callHandler("left");
        }
    }
}

Window_LootList.prototype.processPageup = function(){
    Window_Selectable.prototype.processPageup.call(this);
    this.playCursorSound();
};

Window_LootList.prototype.updateTone = function(){

    if(this.active){
        this.setTone(0,0,0);
    }else{
        this.setTone(-100,-100,-100);
    }

};


// #################################################################################
// WINDOW WEIGHT LIMIT
// #################################################################################
//
// window that shows weight limit for inventory or loot
//

function Window_WeightLimit() {
    this.initialize(...arguments);
}

Window_WeightLimit.prototype = Object.create(Window_Base.prototype);
Window_WeightLimit.prototype.constructor = Window_WeightLimit;

Window_WeightLimit.prototype.initialize = function(rect) {
    Window_Base.prototype.initialize.call(this, rect);
    this._word = {};
    this._textColor = ColorManager.normalColor();
};

Window_WeightLimit.prototype.setWord = function(word) {
    if (this._word !== word) {
        this._word = word;
        this.refresh();
    }
};

Window_WeightLimit.prototype.clear = function() {
    this.setWord({});
};

Window_WeightLimit.prototype.refresh = function() {
    this.contents.clear();
    this.drawWeightLimit();
};

Window_WeightLimit.prototype.setTextColor = function(color) {
    this._textColor = color;
}

Window_WeightLimit.prototype.drawWeightLimit = function(){
    if (this._word) {
        const rect = this.baseTextRect();
        const iconY = rect.y + (this.lineHeight() - ImageManager.iconHeight) / 2;
        const textMargin = ImageManager.iconWidth + 4;
        const itemWidth = Math.max(0, rect.width - textMargin);
        this.changeTextColor(this._textColor);
        this.drawIcon(this._word.iconIndex, rect.x, iconY);
        this.drawText(this._word.name, rect.x + textMargin, rect.y, itemWidth);
    }
}


// #################################################################################
// WINDOW WEIGHT INFO
// #################################################################################
//
// window that shows item weight data
//

function Window_WeightInfo() {
    this.initialize(...arguments);
}

Window_WeightInfo.prototype = Object.create(Window_Base.prototype);
Window_WeightInfo.prototype.constructor = Window_WeightInfo;

Window_WeightInfo.prototype.initialize = function(rect) {
    Window_Base.prototype.initialize.call(this, rect);
    this._text = "";
};

Window_WeightInfo.prototype.setText = function(text) {
    if (this._text !== text) {
        this._text = text;
        this.refresh();
    }
};

Window_WeightInfo.prototype.clear = function() {
    this.setText("");
};

Window_WeightInfo.prototype.refresh = function() {
    const rect = this.baseTextRect();
    this.contents.clear();
    this.drawText(this._text, rect.x, rect.y, rect.width,"center");
};


// #################################################################################
// * SCENE BARTER
// #################################################################################
//
// Scene Class for Barter system
//


function Scene_Barter() {
    this.initialize(...arguments);
}

Scene_Barter.prototype = Object.create(Scene_ItemBase.prototype);
Scene_Barter.prototype.constructor = Scene_Barter;

Scene_Barter.prototype.initialize = function() {
    Scene_ItemBase.prototype.initialize.call(this);
};

Scene_Barter.prototype.create = function() {
    Scene_ItemBase.prototype.create.call(this);
    this.createHelpWindow();
    this.createCategoryWindow();
    this.createItemWindow();
    this.createLootWindow();
    this.createSwitchButton();
    this.createItemLimitWindow();
    this.createLootLimitWindow();
    this.createWeightInfoWindow();
    this.drawLootName();
    if(!$gameSystem._inventoryBarter.lootChest()._isDropZone){
        this._itemWindow.setCategory("item");
        this.onCategoryOk();
        this._itemWindow.deactivate();
        this._categoryWindow.deactivate();
        this._lootWindow.activate();
        this._lootWindow.selectLast();
    }
};

Scene_Barter.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);

    this.drawWeightInfo();
};

Scene_Barter.prototype.createCategoryWindow = function() {
    const rect = this.categoryWindowRect();
    this._categoryWindow = new Window_InventoryCategory(rect);
    this._categoryWindow.setHelpWindow(this._helpWindow);
    this._categoryWindow.setHandler("ok", this.onCategoryOk.bind(this));
    this._categoryWindow.setHandler("cancel", this.popScene.bind(this));
    this.addWindow(this._categoryWindow);
};

Scene_Barter.prototype.categoryWindowRect = function() {
    const wx = 0;
    const wy = this.mainAreaTop();
    const ww = Graphics.boxWidth/2;
    const wh = this.calcWindowHeight(1, true);
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Barter.prototype.createItemWindow = function() {
    const rect = this.itemWindowRect();
    this._itemWindow = new Window_InventoryList(rect);
    this._itemWindow.setHelpWindow(this._helpWindow);
    this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
    this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
    this._itemWindow.setHandler("right", this.onItemToLoot.bind(this));
    this._itemWindow.setHandler("pagedown", this.onItemToLoot.bind(this));
    this.addWindow(this._itemWindow);
    
    this._categoryWindow.setItemWindow(this._itemWindow);
    if (!this._categoryWindow.needsSelection()) {
        this._itemWindow.y -= this._categoryWindow.height;
        this._itemWindow.height += this._categoryWindow.height;
        this._categoryWindow.hide();
        this._categoryWindow.deactivate();
        this.onCategoryOk();
    }
};

Scene_Barter.prototype.itemWindowRect = function() {
    const wx = 0;
    const wy = this._categoryWindow.y + this._categoryWindow.height;
    const ww = Graphics.boxWidth/2;
    const wh = this.mainAreaBottom() - wy - 64;
    return new Rectangle(wx, wy, ww, wh);
};


Scene_Barter.prototype.createLootWindow = function() {
    const rect = this.lootWindowRect();
    this._lootWindow = new Window_LootList(rect);
    this._lootWindow.setHelpWindow(this._helpWindow);
    this._lootWindow.setHandler("ok", this.onLootOk.bind(this));
    this._lootWindow.setHandler("cancel", this.onLootCancel.bind(this));
    this._lootWindow.setHandler("left", this.onLootCancel.bind(this));
    this._lootWindow.setHandler("pageup", this.onLootCancel.bind(this));
    this.addWindow(this._lootWindow);
    this._categoryWindow.setLootWindow(this._lootWindow);
    this._lootWindow.refresh();
};

Scene_Barter.prototype.lootWindowRect = function() {
    const wx = Graphics.boxWidth/2;
    const wy = this._itemWindow.y;//this.mainAreaTop();
    const ww = Graphics.boxWidth/2;
    const wh = this.mainAreaBottom() - wy - 64;
    return new Rectangle(wx, wy, ww, wh);
};


Scene_Barter.prototype.createItemLimitWindow = function() {
    const rect = this.itemLimitWindowRect();
    this._itemLimitWindow = new Window_WeightLimit(rect);
    this.addWindow(this._itemLimitWindow);
    this.refreshItemLimit();
};

Scene_Barter.prototype.refreshItemLimit = function(){

    if($gameSystem._inventoryBarter.currentInventoryWeight() == $gameSystem._inventoryBarter._inventoryLimit){
        this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
    }else{
        this._itemLimitWindow.setTextColor(ColorManager.normalColor());
    }

    let wordStructure = {
        'iconIndex' : $gameSystem._inventoryBarter._iconIndex,
        'name' : ' '+$gameSystem._inventoryBarter.currentInventoryWeight()+"/"+$gameSystem._inventoryBarter._inventoryLimit+" "+$gameSystem._inventoryBarter._weightUnit
    }
    this._itemLimitWindow.setWord(wordStructure);
};

Scene_Barter.prototype.itemLimitWindowRect = function() {
    const wx = 0;
    const wy = this._itemWindow.y + this._itemWindow.height;
    const ww = Graphics.boxWidth/4;
    const wh = 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Barter.prototype.createLootLimitWindow = function() {
    const rect = this.lootLimitWindowRect();
    this._lootLimitWindow = new Window_WeightLimit(rect);
    this.addWindow(this._lootLimitWindow);
    this.refreshLootLimit();
};

Scene_Barter.prototype.refreshLootLimit = function(){
    
    let lootLimit = $gameSystem._inventoryBarter.lootChest()._lootLimit;

    if($gameSystem._inventoryBarter.currentLootWeight() == lootLimit && lootLimit !== 0){
        this._lootLimitWindow.setTextColor(ColorManager.crisisColor());
    }else{
        this._lootLimitWindow.setTextColor(ColorManager.normalColor());
    }

    let lootLimitText = (lootLimit == 0) ? "∞" : lootLimit;
    let wordStructure = {
        'iconIndex' : $gameSystem._inventoryBarter.lootChest()._iconIndex,
        'name' : " "+$gameSystem._inventoryBarter.currentLootWeight()+"/"+lootLimitText+" "+$gameSystem._inventoryBarter._weightUnit
    }
    this._lootLimitWindow.setWord(wordStructure);
};

Scene_Barter.prototype.refreshLimit = function(){
    this.refreshItemLimit();
    this.refreshLootLimit();
};

Scene_Barter.prototype.lootLimitWindowRect = function() {
    const wx = this._lootWindow.x + (Graphics.boxWidth/4);
    const wy = this._itemWindow.y + this._itemWindow.height;
    const ww = Graphics.boxWidth/4;
    const wh = 64;
    return new Rectangle(wx, wy, ww, wh);
};


Scene_Barter.prototype.createWeightInfoWindow = function() {
    const rect = this.weightInfoWindowRect();
    this._weightInfoWindow = new Window_WeightInfo(rect);
    this.addWindow(this._weightInfoWindow);
};

Scene_Barter.prototype.weightInfoWindowRect = function() {
    const wx = this._itemLimitWindow.x+this._itemLimitWindow.width;
    const wy = this._itemWindow.y+this._itemWindow.height;
    const ww = Graphics.boxWidth - (this._itemLimitWindow.width+this._lootLimitWindow.width);
    const wh = 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Barter.prototype.drawWeightInfo = function(){
    // can't use drawTextEx with align
    let numOfSpaces = 0;
    if(this._itemWindow.active && this._itemWindow.item()){
        let weightCondition = ($gameSystem._inventoryBarter.lootChest()._lootLimit == 0) ? false : (Number(this._itemWindow.item().meta.weight)+$gameSystem._inventoryBarter.currentLootWeight() > $gameSystem._inventoryBarter.lootChest()._lootLimit);
       
        if(weightCondition){
            this._weightInfoWindow.setText("weight : "+this._itemWindow.item().meta.weight+" "+$gameSystem._inventoryBarter._weightUnit);
        }else{
            this._weightInfoWindow.setText("weight : "+this._itemWindow.item().meta.weight+" "+$gameSystem._inventoryBarter._weightUnit);
        }
    }else if(this._lootWindow.active && this._lootWindow.item()){
       
        if((Number(this._lootWindow.item().meta.weight)+$gameSystem._inventoryBarter.currentInventoryWeight() > $gameSystem._inventoryBarter._inventoryLimit)){
            
            this._weightInfoWindow.setText("weight : "+this._lootWindow.item().meta.weight+" "+$gameSystem._inventoryBarter._weightUnit);
        }else{
            
            this._weightInfoWindow.setText("weight : "+this._lootWindow.item().meta.weight+" "+$gameSystem._inventoryBarter._weightUnit);
        }
    }else{
        
        this._weightInfoWindow.setText("");
    }
};

Scene_Barter.prototype.createSwitchButton = function(){
    this._pageUpButton = new Sprite_Button("pageup");
    this.addChild(this._pageUpButton);
    this._pageDownButton = new Sprite_Button("pagedown");
    this.addChild(this._pageDownButton);
    this._pageUpButton.hide();
    this._pageDownButton.hide();
};

Scene_Barter.prototype.drawLootName = function(){
    this._lootName = new Sprite(new Bitmap(Graphics.width,Graphics.height));
    this.addChild(this._lootName);
    const x = this._lootWindow.x;
    const y = this._categoryWindow.y;
    const bitmap = this._lootName.bitmap;
    bitmap.fontFace = $gameSystem.mainFontFace();
    bitmap.outlineWidth = 1;
    bitmap.fontSize = 32;
    bitmap.outlineColor = "black";
    bitmap.textColor = ColorManager.crisisColor();
    bitmap.drawText($gameSystem._inventoryBarter.lootChest()._lootName,x,y,this._lootWindow.width,this._categoryWindow.height,"center");
};

Scene_Barter.prototype.onCategoryOk = function() {
    this._pageDownButton.show();
    this._itemWindow.activate();
    this._itemWindow.selectLast();
};

Scene_Barter.prototype.onItemOk = function() {
    $gameSystem._inventoryBarter.setLastItem(this._itemWindow.item());
    $gameParty.loseItem(this._itemWindow.item(),1);
    $gameSystem._inventoryBarter.gainLoot($gameSystem._inventoryBarter._lootId,this._itemWindow.item(),1);
    this._itemWindow.refresh();

    this._lootWindow.refresh();
    this._lootWindow.activate();
    this._lootWindow.selectLast();
    this._lootWindow.deactivate();

    this._itemWindow.activate();
    this.refreshLimit();
};

Scene_Barter.prototype.onItemCancel = function() {
    this._pageDownButton.hide();
    if (this._categoryWindow.needsSelection()) {
        this._itemWindow.deselect();
        this._categoryWindow.activate();
    } else {
        this.popScene();
    }
};

Scene_Barter.prototype.onItemToLoot = function() {
    this._pageDownButton.hide();
    this._pageUpButton.show();
    $gameParty.setLastItem(this._itemWindow.item());
    this._categoryWindow.deactivate();
    this._itemWindow.deactivate();
    this._lootWindow.activate();
    this._lootWindow.selectLast();
};

Scene_Barter.prototype.onLootOk = function() {
    let category = "none";
    
    if(DataManager.isItem(this._lootWindow.item()) && this._lootWindow.item().itypeId === 1){
        category = "item";
    }else if(DataManager.isWeapon(this._lootWindow.item())){
        category = "weapon";
    }else if(DataManager.isArmor(this._lootWindow.item())){
        category = "armor";
    }else if(DataManager.isItem(this._lootWindow.item()) && this._lootWindow.item().itypeId === 2){
        category = "keyItem";
    }
    this._categoryWindow.selectSymbol(category);
    this._itemWindow.setCategory(category);
    $gameParty.setLastItem(this._lootWindow.item());
    $gameSystem._inventoryBarter.loseLoot($gameSystem._inventoryBarter._lootId,this._lootWindow.item(),1)
    $gameParty.gainItem(this._lootWindow.item(),1);
    this._lootWindow.refresh();

    this._itemWindow.refresh();
    this._itemWindow.activate();
    this._itemWindow.selectLast();
    this._itemWindow.deactivate();

    this._lootWindow.activate();
    this.refreshLimit();
};

Scene_Barter.prototype.onLootCancel = function() {
    this._pageUpButton.hide();
    this._pageDownButton.show();
    $gameSystem._inventoryBarter.setLastItem(this._lootWindow.item());
    this._lootWindow.deactivate();
    this._itemWindow.activate();
    this._itemWindow.selectLast();
};

Scene_Barter.prototype.playSeForItem = function() {
    SoundManager.playUseItem();
};


// #################################################################################
// _EDIT SCENE ITEM
// #################################################################################
//
// show weight limit window & weight info window
//

const _Scene_Item_CreateItemWindow = Scene_Item.prototype.createItemWindow;
Scene_Item.prototype.createItemWindow = function() {
    _Scene_Item_CreateItemWindow.apply(this,arguments);
    
    this.createItemLimitWindow();
    this.createWeightInfoWindow();
};

const _Scene_Item_Update = Scene_Item.prototype.update;
Scene_Item.prototype.update = function() {
    _Scene_Item_Update.apply(this,arguments);

    this.drawWeightInfo();
    this.refreshItemLimit();
};

Scene_Item.prototype.itemWindowRect = function() {
    const wx = 0;
    const wy = this._categoryWindow.y + this._categoryWindow.height;
    const ww = Graphics.boxWidth;
    const wh = this.mainAreaBottom() - wy -64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Item.prototype.createItemLimitWindow = function() {
    const rect = this.itemLimitWindowRect();
    this._itemLimitWindow = new Window_WeightLimit(rect);
    this.addWindow(this._itemLimitWindow);
    this.refreshItemLimit();
};

Scene_Item.prototype.refreshItemLimit = function(){
    let wordStructure = {
        'iconIndex' : $gameSystem._inventoryBarter._iconIndex,
        'name' : ' '+$gameSystem._inventoryBarter.currentInventoryWeight()+"/"+$gameSystem._inventoryBarter._inventoryLimit+" "+$gameSystem._inventoryBarter._weightUnit
    }
    this._itemLimitWindow.setWord(wordStructure);
};

Scene_Item.prototype.itemLimitWindowRect = function() {
    const wx = 0;
    const wy = this._itemWindow.y + this._itemWindow.height;
    const ww = Graphics.boxWidth/4;
    const wh = 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Item.prototype.createWeightInfoWindow = function() {
    const rect = this.weightInfoWindowRect();
    this._weightInfoWindow = new Window_WeightInfo(rect);
    this.addWindow(this._weightInfoWindow);
};

Scene_Item.prototype.weightInfoWindowRect = function() {
    const wx = this._itemLimitWindow.x+this._itemLimitWindow.width;
    const wy = this._itemWindow.y+this._itemWindow.height;
    const ww = Graphics.boxWidth - (this._itemLimitWindow.width);
    const wh = 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Item.prototype.drawWeightInfo = function(){

    if(this._itemWindow.active && this._itemWindow.item()){
        let weightCondition = ($gameSystem._inventoryBarter.lootChest()._lootLimit == 0) ? false : (Number(this._itemWindow.item().meta.weight)+$gameSystem._inventoryBarter.currentLootWeight() > $gameSystem._inventoryBarter.lootChest()._lootLimit);
        
        if(weightCondition){
            
            this._weightInfoWindow.setTextColor(ColorManager.deathColor());
            this._weightInfoWindow.setText("weight : "+this._itemWindow.item().meta.weight+" "+$gameSystem._inventoryBarter._weightUnit);
        }else{
            
            this._weightInfoWindow.setTextColor(ColorManager.normalColor());
            this._weightInfoWindow.setText("weight : "+this._itemWindow.item().meta.weight+" "+$gameSystem._inventoryBarter._weightUnit);
        }
    }else{
        
        this._weightInfoWindow.setTextColor(ColorManager.normalColor());
        this._weightInfoWindow.setText("");
    }
};

// #################################################################################
// WINDOW NOOB ENGINEER EQUIP ITEM
// #################################################################################
//
// change window_equipitem item enabled behaviour
//

function Window_SVR_EquipItem() {
    this.initialize(...arguments);
}

Window_SVR_EquipItem.prototype = Object.create(Window_EquipItem.prototype);
Window_SVR_EquipItem.prototype.constructor = Window_SVR_EquipItem;

Window_SVR_EquipItem.prototype.initialize = function(rect) {
    Window_EquipItem.prototype.initialize.call(this,rect);
    this._slotWindow = {};
};

Window_SVR_EquipItem.prototype.setSlotWindow =  function(slotWindow){
    this._slotWindow = slotWindow;
};

Window_SVR_EquipItem.prototype.isEnabled = function(item) {
    let itemWeight = 0;
    let equipWeight = 0;
    if(item){
        itemWeight = (item.meta.weight) ? Number(item.meta.weight) : 0;
    }
    if(this._slotWindow.item()){
        equipWeight = (this._slotWindow.item().meta.weight) ? Number(this._slotWindow.item().meta.weight) : 0; 
    }
    return ($gameSystem._inventoryBarter.currentInventoryWeight()+equipWeight-itemWeight < $gameSystem._inventoryBarter._inventoryLimit)
};


// #################################################################################
// _EDIT SCENE EQUIP
// #################################################################################
//
// implement unequip restriction based on available inventory space
//

Scene_Equip.prototype.createItemWindow = function() {
    const rect = this.itemWindowRect();
    this._itemWindow = new Window_SVR_EquipItem(rect);
    this._itemWindow.setHelpWindow(this._helpWindow);
    this._itemWindow.setStatusWindow(this._statusWindow);
    this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
    this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
    this._itemWindow.hide();
    this._itemWindow.setSlotWindow(this._slotWindow);
    this._slotWindow.setItemWindow(this._itemWindow);
    this.addWindow(this._itemWindow);
    this.createItemLimitWindow();
    this.createWeightInfoWindow();
};

const _Scene_Equip_Update = Scene_Equip.prototype.update;
Scene_Equip.prototype.update = function(){
    _Scene_Equip_Update.apply(this,arguments);
    
    this.refreshItemLimit();
    this.drawWeightInfo();
};

Scene_Equip.prototype.slotWindowRect = function() {
    const commandWindowRect = this.commandWindowRect();
    const wx = this.statusWidth();
    const wy = commandWindowRect.y + commandWindowRect.height;
    const ww = Graphics.boxWidth - this.statusWidth();
    const wh = this.mainAreaHeight() - commandWindowRect.height - 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Equip.prototype.createItemLimitWindow = function() {
    const rect = this.itemLimitWindowRect();
    this._itemLimitWindow = new Window_WeightLimit(rect);
    this.addWindow(this._itemLimitWindow);
    this.refreshItemLimit();
};

Scene_Equip.prototype.refreshItemLimit = function(){
    let _limitText = "";
    
    // WINDOW COMMAND
    if(this._commandWindow.active){

        let equipWeight = $gameSystem._inventoryBarter.menuActorEquipWeight();

        // CLEAR - ENABLED/DISABLED
        let clearWeight = $gameSystem._inventoryBarter.currentInventoryWeight()+equipWeight;
        if(clearWeight > $gameSystem._inventoryBarter._inventoryLimit){
            this._commandWindow._list[this._commandWindow.findSymbol("clear")].enabled = false;
        }else{
            this._commandWindow._list[this._commandWindow.index()].enabled = true;
        }

        // OPTIMIZE - ENABLED/DISABLED
        let bestWeight = 0;
        for(let i = 0; i < this.actor().equipSlots().length; i++){
            let bestItem = this.actor().NE_bestEquipItem(i);
            if(bestItem){
                bestWeight += (bestItem.meta.weight) ? Number(bestItem.meta.weight) : 0; 
            }
        }
        let optimizeWeight = $gameSystem._inventoryBarter.currentInventoryWeight()-bestWeight+equipWeight;

        if(optimizeWeight > $gameSystem._inventoryBarter._inventoryLimit){
            this._commandWindow._list[this._commandWindow.findSymbol("optimize")].enabled = false;
        }else{
            this._commandWindow._list[this._commandWindow.findSymbol("optimize")].enabled = true;
        }

        // CLEAR - LIMIT COLOR
        if(this._commandWindow.active && this._commandWindow.currentSymbol() == "clear"){
            
            if(clearWeight == $gameSystem._inventoryBarter._inventoryLimit){
                this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
            }else if(clearWeight > $gameSystem._inventoryBarter._inventoryLimit){
                this._itemLimitWindow.setTextColor(ColorManager.deathColor());
            }else{
                this._itemLimitWindow.setTextColor(ColorManager.normalColor());
            }

            _limitText = " "+clearWeight+"/"+$gameSystem._inventoryBarter._inventoryLimit+" "+$gameSystem._inventoryBarter._weightUnit;
        
        // OPTIMIZE - LIMIT COLOR
        }else if(this._commandWindow.active && this._commandWindow.currentSymbol() == "optimize"){
            if(optimizeWeight == $gameSystem._inventoryBarter._inventoryLimit){
                this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
            }else if(optimizeWeight > $gameSystem._inventoryBarter._inventoryLimit){
                this._itemLimitWindow.setTextColor(ColorManager.deathColor());
            }else{
                this._itemLimitWindow.setTextColor(ColorManager.normalColor());
            }
            _limitText = " "+optimizeWeight+"/"+$gameSystem._inventoryBarter._inventoryLimit+" "+$gameSystem._inventoryBarter._weightUnit;
        
        
        // EQUIP - LIMIT COLOR
        }else{
            if($gameSystem._inventoryBarter.currentInventoryWeight() == $gameSystem._inventoryBarter._inventoryLimit){
                this._itemLimitWindow.setTextColor(ColorManager.crisisColor())
            }else{
                this._itemLimitWindow.setTextColor(ColorManager.normalColor());
            }
            _limitText = " "+$gameSystem._inventoryBarter.currentInventoryWeight()+"/"+$gameSystem._inventoryBarter._inventoryLimit+" "+$gameSystem._inventoryBarter._weightUnit;
        }

        this._commandWindow.drawAllItems();

    }

    // EQUIPITEM WINDOW
    if(this._itemWindow.active){
        let equipWeight = 0;
        
        if(this._slotWindow.item()){
            equipWeight = (this._slotWindow.item().meta.weight) ? Number(this._slotWindow.item().meta.weight) : 0;
        }
        
        let itemWeight = 0;
        if(this._itemWindow.item()){
            itemWeight = (this._itemWindow.item().meta.weight) ? Number(this._itemWindow.item().meta.weight) : 0;
        }

        let weight = $gameSystem._inventoryBarter.currentInventoryWeight() + equipWeight - itemWeight;
        _limitText = " "+weight+"/"+$gameSystem._inventoryBarter._inventoryLimit+" "+$gameSystem._inventoryBarter._weightUnit;

        //ITEM LIMIT COLOR
        if(weight == $gameSystem._inventoryBarter._inventoryLimit){
            this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
        }else if(weight > $gameSystem._inventoryBarter._inventoryLimit){
            this._itemLimitWindow.setTextColor(ColorManager.deathColor());
        }else{
            this._itemLimitWindow.setTextColor(ColorManager.normalColor());
        }

    }
    
    // EQUIPSLOT WINDOW
    if(this._slotWindow.active){
        if($gameSystem._inventoryBarter.currentInventoryWeight() == $gameSystem._inventoryBarter._inventoryLimit){
            this._itemLimitWindow.setTextColor(ColorManager.crisisColor())
        }else{
            this._itemLimitWindow.setTextColor(ColorManager.normalColor());
        }
        _limitText = " "+$gameSystem._inventoryBarter.currentInventoryWeight()+"/"+$gameSystem._inventoryBarter._inventoryLimit+" "+$gameSystem._inventoryBarter._weightUnit;
    } 

    let wordStructure = {
        'iconIndex' : $gameSystem._inventoryBarter._iconIndex,
        'name' : _limitText
    }
    this._itemLimitWindow.setWord(wordStructure);
};

Scene_Equip.prototype.itemLimitWindowRect = function() {
    const wx = this._itemWindow.x;
    const wy = this._itemWindow.y + this._itemWindow.height;
    const ww = this._itemWindow.width/2;
    const wh = 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Equip.prototype.createWeightInfoWindow = function() {
    const rect = this.weightInfoWindowRect();
    this._weightInfoWindow = new Window_WeightInfo(rect);
    this.addWindow(this._weightInfoWindow);
};

Scene_Equip.prototype.weightInfoWindowRect = function() {
    const wx = this._itemLimitWindow.x+this._itemLimitWindow.width;
    const wy = this._itemWindow.y+this._itemWindow.height;
    const ww = this._itemWindow.width-this._itemLimitWindow.width;
    const wh = 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Equip.prototype.drawWeightInfo = function(){
    
    if(this._itemWindow.active && this._itemWindow.item()){
        
        this._weightInfoWindow.setText("weight : "+this._itemWindow.item().meta.weight+" "+$gameSystem._inventoryBarter._weightUnit);
        
    }else if(this._slotWindow.active && this._slotWindow.item()){
        
        this._weightInfoWindow.setText("weight : "+this._slotWindow.item().meta.weight+" "+$gameSystem._inventoryBarter._weightUnit);
        
    }else if(this._commandWindow.active && this._commandWindow.currentSymbol() == "equip"){
        let equipWeight = $gameSystem._inventoryBarter.menuActorEquipWeight();
        
        this._weightInfoWindow.setText("Σ weight : "+equipWeight+" "+$gameSystem._inventoryBarter._weightUnit);
        
    }else if(this._commandWindow.active && this._commandWindow.currentSymbol() == "clear"){

        this._weightInfoWindow.setText("Σ weight : 0 WP");
        
    }else if(this._commandWindow.active && this._commandWindow.currentSymbol() == "optimize"){
        let equipWeight = $gameSystem._inventoryBarter.menuActorEquipWeight();
        let optimizeWeight = 0;
        for(let i = 0; i < this.actor().equipSlots().length; i++){
            let bestItem = this.actor().NE_bestEquipItem(i);
            if(bestItem){
                optimizeWeight += (bestItem.meta.weight) ? Number(bestItem.meta.weight) : 0; 
            }
        }

        if(optimizeWeight == equipWeight) {
            this._weightInfoWindow.setText("Σ weight : "+optimizeWeight+" "+$gameSystem._inventoryBarter._weightUnit);
        }else if(optimizeWeight > equipWeight){
            this._weightInfoWindow.setText("Σ weight : "+optimizeWeight+" "+$gameSystem._inventoryBarter._weightUnit);
        }else{
            this._weightInfoWindow.setText("Σ weight : "+optimizeWeight+" "+$gameSystem._inventoryBarter._weightUnit);
        }

        
    }else{
        this._weightInfoWindow.setText("");
    }
};

// #################################################################################
// _ADD GAME ACTOR
// #################################################################################
//
// create custom optimize equip calculation
//

Game_Actor.prototype.NE_bestEquipItem = function(slotId) {
    const etypeId = this.equipSlots()[slotId];
    const items = $gameParty
        .equipItems()
        .concat($gameParty.menuActor().equips().filter(n => n))
        .filter(item => item.etypeId === etypeId && this.canEquip(item));
    let bestItem = null;
    let bestPerformance = -1000;
    for (let i = 0; i < items.length; i++) {
        const performance = this.calcEquipItemPerformance(items[i]);
        if (performance > bestPerformance) {
            bestPerformance = performance;
            bestItem = items[i];
        }
    }
    return bestItem;
};

// #################################################################################
// _EDIT SCENE SHOP
// #################################################################################
//
// implement buy restriction based on inventory limit
//

const _Scene_Shop_Create = Scene_Shop.prototype.create;
Scene_Shop.prototype.create = function(){
    _Scene_Shop_Create.apply(this,arguments);
    this.createItemLimitWindow();
    this.createWeightInfoWindow();
};

Scene_Shop.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);

    this.drawWeightInfo();
    this.refreshItemLimit();
};

const _Scene_Shop_BuyOk = Scene_Shop.prototype.onBuyOk;
Scene_Shop.prototype.onBuyOk = function(){
    _Scene_Shop_BuyOk.apply(this,arguments);

    this.drawWeightInfo();
    this.refreshItemLimit();

};

const _Scene_Shop_SellOk = Scene_Shop.prototype.onSellOk;
Scene_Shop.prototype.onSellOk = function(){
    _Scene_Shop_SellOk.apply(this,arguments);

    this.drawWeightInfo();
    this.refreshItemLimit();

};

Scene_Shop.prototype.dummyWindowRect = function() {
    const wx = 0;
    const wy = this._commandWindow.y + this._commandWindow.height;
    const ww = Graphics.boxWidth;
    const wh = this.mainAreaHeight() - this._commandWindow.height - 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Shop.prototype.statusWindowRect = function() {
    const ww = this.statusWidth();
    const wh = this._dummyWindow.height + 64;
    const wx = Graphics.boxWidth - ww;
    const wy = this._dummyWindow.y;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Shop.prototype.sellWindowRect = function() {
    const wx = 0;
    const wy = this._categoryWindow.y + this._categoryWindow.height;
    const ww = Graphics.boxWidth;
    const wh =
        this.mainAreaHeight() -
        this._commandWindow.height -
        this._categoryWindow.height - 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Shop.prototype.createItemLimitWindow = function() {
    const rect = this.itemLimitWindowRect();
    this._itemLimitWindow = new Window_WeightLimit(rect);
    this.addWindow(this._itemLimitWindow);
    this.refreshItemLimit();
};

Scene_Shop.prototype.refreshItemLimit = function(){
    let weight = 0;

    if(this._commandWindow.currentSymbol() == "buy"){
        if(this._buyWindow.active && this._buyWindow.item()){
            let itemWeight = (this._buyWindow.item().meta.weight) ? Number(this._buyWindow.item().meta.weight) : 0;
            weight = itemWeight+$gameSystem._inventoryBarter.currentInventoryWeight();
    
            if(weight == $gameSystem._inventoryBarter._inventoryLimit){

                this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
            
            }else if(weight > $gameSystem._inventoryBarter._inventoryLimit){
    
                this._itemLimitWindow.setTextColor(ColorManager.deathColor());
            }else{
                
                this._itemLimitWindow.setTextColor(ColorManager.normalColor());
            }
        }else if(this._numberWindow.active){
            let itemWeight = (this._buyWindow.item().meta.weight) ? Number(this._buyWindow.item().meta.weight) : 0;
            weight = (itemWeight*this._numberWindow._number)+$gameSystem._inventoryBarter.currentInventoryWeight();
    
            if(weight == $gameSystem._inventoryBarter._inventoryLimit){

                this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
            
            }else if(weight > $gameSystem._inventoryBarter._inventoryLimit){
    
                this._itemLimitWindow.setTextColor(ColorManager.deathColor());
            }else{
                
                this._itemLimitWindow.setTextColor(ColorManager.normalColor());
            }
        }else{

            weight = $gameSystem._inventoryBarter.currentInventoryWeight();
            
            if(weight == $gameSystem._inventoryBarter._inventoryLimit){

                this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
            
            }else if(weight > $gameSystem._inventoryBarter._inventoryLimit){
    
                this._itemLimitWindow.setTextColor(ColorManager.deathColor());
            }else{
                
                this._itemLimitWindow.setTextColor(ColorManager.normalColor());
            }
        }
    }else if(this._commandWindow.currentSymbol() == "sell"){
        if(this._sellWindow.active && this._sellWindow.item()){
            let itemWeight = (this._sellWindow.item().meta.weight) ? Number(this._sellWindow.item().meta.weight) : 0;
            weight = $gameSystem._inventoryBarter.currentInventoryWeight()-itemWeight;
    
            if(weight == $gameSystem._inventoryBarter._inventoryLimit){

                this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
            
            }else if(weight > $gameSystem._inventoryBarter._inventoryLimit){
    
                this._itemLimitWindow.setTextColor(ColorManager.deathColor());
            }else{
                
                this._itemLimitWindow.setTextColor(ColorManager.normalColor());
            }
        }else if(this._numberWindow.active){
            let itemWeight = (this._sellWindow.item().meta.weight) ? Number(this._sellWindow.item().meta.weight) : 0;
            weight = $gameSystem._inventoryBarter.currentInventoryWeight()-(itemWeight*this._numberWindow._number);
    
            if(weight == $gameSystem._inventoryBarter._inventoryLimit){

                this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
            
            }else if(weight > $gameSystem._inventoryBarter._inventoryLimit){
    
                this._itemLimitWindow.setTextColor(ColorManager.deathColor());
            }else{
                
                this._itemLimitWindow.setTextColor(ColorManager.normalColor());
            }
        }else{

            weight = $gameSystem._inventoryBarter.currentInventoryWeight();
            
            if(weight == $gameSystem._inventoryBarter._inventoryLimit){

                this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
            
            }else if(weight > $gameSystem._inventoryBarter._inventoryLimit){
    
                this._itemLimitWindow.setTextColor(ColorManager.deathColor());
            }else{
                
                this._itemLimitWindow.setTextColor(ColorManager.normalColor());
            }
        }
    }else{

        weight = $gameSystem._inventoryBarter.currentInventoryWeight();
        
        if(weight == $gameSystem._inventoryBarter._inventoryLimit){

            this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
        
        }else if(weight > $gameSystem._inventoryBarter._inventoryLimit){

            this._itemLimitWindow.setTextColor(ColorManager.deathColor());
        }else{
            
            this._itemLimitWindow.setTextColor(ColorManager.normalColor());
        }
    }

    let _limitText = " "+weight+"/"+$gameSystem._inventoryBarter._inventoryLimit+" "+$gameSystem._inventoryBarter._weightUnit;

    let wordStructure = {
        'iconIndex' : $gameSystem._inventoryBarter._iconIndex,
        'name' : _limitText
    }
    this._itemLimitWindow.setWord(wordStructure);
};

Scene_Shop.prototype.itemLimitWindowRect = function() {
    const wx = 0;
    const wy = this._dummyWindow.y + this._dummyWindow.height;
    const ww = Graphics.boxWidth/4;
    const wh = 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Shop.prototype.createWeightInfoWindow = function() {
    const rect = this.weightInfoWindowRect();
    this._weightInfoWindow = new Window_WeightInfo(rect);
    this.addWindow(this._weightInfoWindow);
};

Scene_Shop.prototype.weightInfoWindowRect = function() {
    const wx = this._itemLimitWindow.width;
    const wy = this._dummyWindow.y + this._dummyWindow.height;
    const ww = this._dummyWindow.width -
               this._itemLimitWindow.width -
               this._statusWindow.width;
    const wh = 64;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Shop.prototype.drawWeightInfo = function(){
    let weight = 0;

    // BUY
    if(this._commandWindow.currentSymbol() == "buy"){
        if(this._buyWindow.active && this._buyWindow.item()){
        
            weight = (this._buyWindow.item().meta.weight) ? Number(this._buyWindow.item().meta.weight) : 0;
            this._weightInfoWindow.setText("weight : " + weight + " "+$gameSystem._inventoryBarter._weightUnit);
    
        }else if(this._numberWindow.active){
    
            weight = (this._buyWindow.item().meta.weight) ? Number(this._buyWindow.item().meta.weight) : 0;
            this._weightInfoWindow.setText("weight : " + weight + " x "+ this._numberWindow._number +" "+$gameSystem._inventoryBarter._weightUnit);
            
        }else{
            this._weightInfoWindow.setText("");
        }
    }
    // SELL
    else if(this._commandWindow.currentSymbol() == "sell"){
        if(this._sellWindow.active && this._sellWindow.item()){
        
            weight = (this._sellWindow.item().meta.weight) ? Number(this._sellWindow.item().meta.weight) : 0;
            this._weightInfoWindow.setText("weight : " + weight + " "+$gameSystem._inventoryBarter._weightUnit);
    
        }else if(this._numberWindow.active){
    
            weight = (this._sellWindow.item().meta.weight) ? Number(this._sellWindow.item().meta.weight) : 0;
            this._weightInfoWindow.setText("weight : " + weight + " x "+ this._numberWindow._number +" "+$gameSystem._inventoryBarter._weightUnit);
            
        }else{
            this._weightInfoWindow.setText("");
        }
    }
    // -
    else{
        this._weightInfoWindow.setText("");
    }
    
};

Scene_Shop.prototype.maxBuy = function() {
    const weight = Math.floor(($gameSystem._inventoryBarter._inventoryLimit-$gameSystem._inventoryBarter.currentInventoryWeight())/Number(this._item.meta.weight));
    const num = $gameParty.numItems(this._item);
    const max = $gameParty.maxItems(this._item) - num;
    const price = this.buyingPrice();
    if (price > 0) {
        let _compare = Math.min(max, Math.floor(this.money() / price));
        return Math.min(_compare,weight);
    } else {
        return max;
    }
};

// #################################################################################
// _EDIT WINDOW SHOP BUY
// #################################################################################
//
// disable buy item when inventory space not enough
//

Window_ShopBuy.prototype.isEnabled = function(item) {
    return (
        item && this.price(item) <= this._money && !$gameParty.hasMaxItems(item) && $gameSystem._inventoryBarter.currentInventoryWeight()+Number(item.meta.weight) <= $gameSystem._inventoryBarter._inventoryLimit
    );
};

// #################################################################################
// _EDIT BATTLE MANAGER
// #################################################################################
//
// skip drop item gain and show scene barter after battle event instead
//

BattleManager.displayDropItems = function(){
    $gameSystem._inventoryBarter.newLoot(0,0,"Battle Loot",208,false);
    const items = this._rewards.items;
    for (const item of items) {
        $gameSystem._inventoryBarter.gainLoot(0,item, 1);
    }
};

BattleManager.gainDropItems = function(){
    $gameSystem._inventoryBarter._lootId = 0;
};

const _Scene_Map_Start = Scene_Map.prototype.start;
Scene_Map.prototype.start = function(){
    _Scene_Map_Start.apply(this,arguments);

    if(SceneManager.isPreviousScene(Scene_Battle) && $gameSystem._inventoryBarter.allItems().length > 0){
        SceneManager.push(Scene_Barter);
    }
}


// #################################################################################
// _EDIT SCENE MESSAGE
// #################################################################################
//
// show inventory limit when selecting item (cosmetic purpose)
//

const _Scene_Message_EventItem = Scene_Message.prototype.createEventItemWindow;
Scene_Message.prototype.createEventItemWindow = function() {
    _Scene_Message_EventItem.apply(this,arguments);

    this.createItemLimitWindow();
    this._itemLimitWindow.openness = 0;
};

Scene_Message.prototype.createItemLimitWindow = function(){
    const rect = this.itemLimitWindowRect();
    this._itemLimitWindow = new Window_WeightLimit(rect);
    this.addWindow(this._itemLimitWindow);
};

Scene_Message.prototype.itemLimitWindowRect = function() {
    const wx = 0;
    const wy = Graphics.boxHeight-this._eventItemWindow.height - this.calcWindowHeight(1, false);
    const ww = Graphics.boxWidth/4;
    const wh = this.calcWindowHeight(1, false);
    return new Rectangle(wx, wy, ww, wh);
};

const _Scene_Message_Assoc = Scene_Message.prototype.associateWindows;
Scene_Message.prototype.associateWindows = function() {
    _Scene_Message_Assoc.apply(this,arguments);
    this._messageWindow.setItemLimitWindow(this._itemLimitWindow);
};


// #################################################################################
// _EDIT WINDOW MESSAGE
// #################################################################################
//
// set inventory limit window for item select event
//

const _Window_Message_Member = Window_Message.prototype.initMembers;
Window_Message.prototype.initMembers = function() {
    _Window_Message_Member.apply(this,arguments);
    this._itemLimitWindow = null;
};

Window_Message.prototype.setItemLimitWindow = function(itemLimitWindow) {
    this._itemLimitWindow = itemLimitWindow;
};


Window_Message.prototype.startInput = function() {
    if ($gameMessage.isChoice()) {
        this._itemLimitWindow.openness = 0;
        this._choiceListWindow.start();
        return true;
    } else if ($gameMessage.isNumberInput()) {
        this._itemLimitWindow.openness = 0;
        this._numberInputWindow.start();
        return true;
    } else if ($gameMessage.isItemChoice()) {
        this._eventItemWindow.start();
        this._itemLimitWindow.open();
        if($gameSystem._inventoryBarter.currentInventoryWeight() == $gameSystem._inventoryBarter._inventoryLimit){
            this._itemLimitWindow.setTextColor(ColorManager.crisisColor());
        }else{
            this._itemLimitWindow.setTextColor(ColorManager.normalColor());
        }

        let wordStructure = {
            'iconIndex' : $gameSystem._inventoryBarter._iconIndex,
            'name' : ' '+$gameSystem._inventoryBarter.currentInventoryWeight()+"/"+$gameSystem._inventoryBarter._inventoryLimit+" "+$gameSystem._inventoryBarter._weightUnit
        }
        this._itemLimitWindow.setWord(wordStructure);

        return true;
    } else {
        this._itemLimitWindow.openness = 0;
        return false;
    }
};
