import { Component, ViewEncapsulation, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import template from './dynamic-model.template.template.html';
import { Location } from '@angular/common';
import { RuleService } from '../../services/rule/rule.service';
import { CountryListService } from '../../services/country-list/country-list.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { Data } from "../../services/shared.service";

@Component({
	selector: 'add-rule',
	template,
	encapsulation: ViewEncapsulation.None,
	providers: [ RuleService, CountryListService ],
	directives: [TagInputComponent]
})
export class AddRuleComponent implements OnInit {
	counter = 0;
	maxRuleAddLimit = 5;
	rule = {};
	groups = [];
    groupsUpdated = [];
	MAX_WEEKS = 52;
	MAX_MONTHS = 12;
	MAX_DAYS = 366;
	emails = [];
	
	@ViewChild ('myForm') myForm;

	constructor (loc: Location, ruleService: RuleService, countryListService: CountryListService, router: Router, route: ActivatedRoute, toastr: ToastsManager, data: Data) {
		var me = this;

		me.data = data;
		me.router = router;
		me.route = route;
		me.ruleService = ruleService;
		me.countryListService = countryListService;
		me.countries = [];
		me.toastr = toastr;
		me.listOpen = false;
		me.countryNames = [];
		me.operator = [];
		me.issCountryField = [];
		me.countryList = JSON.parse(sessionStorage.getItem('countryList'));
		me.isGroupOpen = false;
		me.isFirstOpen = true;
		me.txnAmounts = [{ name: 'is equal to', value: 'equals' }, { name: 'is not equal to', value: 'notequals' }];
		me.timeUnits = [{ name: 'Days', value: 'days' }, { name: 'Weeks', value: 'weeks' }, { name: 'Months', value: 'months' }];
		me.issCountryOperators = [{ name: 'is other than', value: 'other' },
			{ name: 'is equal to', value: 'equals' },
			{ name: 'is one of', value: 'oneof' },
			{ name: 'is not equal to', value: 'notequals' }];
		me.setState ();
		if (me.countryList) {
			me.countries = me.countryList;
			me.renderView ();
		} else {
			me.countryListService.getCountryList().subscribe (response => {
				me.countries = response;
				sessionStorage.setItem('countryList', JSON.stringify(me.countries));
				me.renderView ();
			}, error => {
				console.log(error);
				this.errorMessage = error;
				this.toastr.error (this.errorMessage, 'Get Country list Status', { toastLife: 3000 });
			});
		}
	}

	setState () {
		this.route.params.subscribe(params => {
			this.state = params.state;
		});
	}

	renderView () {
		if ('edit' === this.state) {
            this.openUpdateForm ();
        } else {
			this.addRule ();
		}
	}

	removeRule (index) {
		if (this.counter > 1) {
			this.counter--;
			this.removeAt(index);
		}
		// this.counter = 1;
        this.counter = this.groups.length;
        return false;
	}

	removeAt (index) {
		const len = this.groups.length;

		for (let i = index + 1; i < len; ++i) {
			this.groups[i - 1] = this.groups[i];
		}
		this.groups.length = len - 1;
	}

	trackByIndex (index) {
		return index;
	}

	addRule (i) {
		if (this.myForm && this.myForm.invalid) {
			this.myForm.controls[this.groups[i].location].markAsTouched ();
            this.myForm.controls[this.groups[i].dateRange].markAsTouched ();
			return false;
		}
		this.proceedToAddRule ();
		return true;
	}

	proceedToAddRule () {
		let accordionGroupContent,
			lastGroupIdx;

		if (this.counter < this.maxRuleAddLimit) {
			this.counter++;
			if (0 === this.groups.length) {
				accordionGroupContent = {
					location: `location${ this.counter }`,
					amt: `amt${ this.counter }`,
					amtType: `amtType${ this.counter }`,
					dateRange: `dateRange${ this.counter }`,
					dateRangeType: `dateRangeType${ this.counter }`,
					issCountryOperator: `issCountryType${ this.counter }`,
					issCountryShuffleBox: `issCountryShuffleBox${ this.counter }`,
					issCountryDropdown: `issCountryDropdown${ this.counter }`,
					issCountryShuffleInput: `issCountryShuffleInput${ this.counter }`,
					isOpenShuffleBox: `isOpenShuffleBox${ this.counter }`,
					countries: `countries${ this.counter }`,
					idx: this.counter,
					ruleId: `ruleId${ this.counter }`,
					status: `status${ this.counter }`,
                    invalidDateRange: `invalidDateRange${ this.counter }`
				};
			} else {
				lastGroupIdx = this.groups[this.groups.length - 1].idx;
				accordionGroupContent = {
					location: `location${ lastGroupIdx + 1 }`,
					amt: `amt${ lastGroupIdx + 1 }`,
					amtType: `amtType${ lastGroupIdx + 1 }`,
					dateRange: `dateRange${ lastGroupIdx + 1 }`,
					dateRangeType: `dateRangeType${ lastGroupIdx + 1 }`,
					issCountryOperator: `issCountryOperator${ lastGroupIdx + 1 }`,
					issCountryShuffleBox: `issCountryShuffleBox${ lastGroupIdx + 1 }`,
					issCountryDropdown: `issCountryDropdown${ lastGroupIdx + 1 }`,
					issCountryShuffleInput: `issCountryShuffleInput${ lastGroupIdx + 1 }`,
					isOpenShuffleBox: `isOpenShuffleBox${ lastGroupIdx + 1 }`,
					countries: `countries${ lastGroupIdx + 1 }`,
					idx: lastGroupIdx + 1,
					ruleId: `ruleId${ lastGroupIdx + 1 }`,
					status: `status${ lastGroupIdx + 1 }`,
                    invalidDateRange: `invalidDateRange${ lastGroupIdx + 1 }`
				};
			}
			this.groups.push (accordionGroupContent);
			if('edit' !== this.state) {
				this.setDropDownDefaults ();
			}
		} else if(5 === this.counter){
			this.toastr.warning('Maximum five rules can be added', 'Add Rule Status', { toastLife: 12000 });
		}
	}

	save () {
		const rules = this.mapToJson();
		var iscall;
		this.isSaving = true;

		iscall = this.ruleService.createRule(rules);
		iscall.subscribe(response => {
			this.checkForDuplicateRules (response._body);
			this.isSaving = false;
		}, error => {
			console.log(error);
			this.isSaving = false;
			this.errorMessage = error;
			this.toastr.error(this.errorMessage, 'Add Rule Status', { toastLife: 9000 });
            return false;
		}
		);
	}

    checkForDuplicateRules(rules) {
        this.groups = [];
        const duplicates = JSON.parse(rules).filter(rule => rule.isDuplicate == "Y");

        const ruleIds = JSON.parse(rules).filter(rule => rule.isDuplicate == "N").map(r => {
            return r.ruleId;
        });


        if (duplicates.length === 0 && ruleIds.length > 0) {
            // all rules created successfully with no duplicates
            let msg = '',
                heading = '';

            this.counter = 0;
            this.groups = [];
            this.proceedToAddRule();
            this._markAsUntouched();
            if ('edit' === this.state) {
                if (ruleIds.length > 1) {
                    msg = 'Rules ' + ruleIds.join(", ") + ' has been updated successfully.';
                }
                else {
                    msg = 'Rule ' + ruleIds.join(", ") + ' has been updated successfully.';
                }

                heading = 'Edit Rule Status';
                this.toastr.success(msg, heading, {toastLife: 9000});
                this.router.navigate(['/']);
            } else {

                if (ruleIds.length > 1) {
                    msg = 'Rules ' + ruleIds.join(", ") + ' has been created successfully.';
                }
                else {
                    msg = 'Rule ' + ruleIds.join(", ") + ' has been created successfully.';
                }

                heading = 'Add Rule Status';
                this.toastr.success(msg, heading, {toastLife: 9000});
            }

        } else if (duplicates.length > 0 && ruleIds.length === 0) {
            // duplicates are present
            let msg = '',
                heading = '';
            this.counter = this.groups;
            this.setModelValues(duplicates);
            if ('edit' === this.state) {
                if (duplicates.length > 1) {
                    msg = 'You are trying to update Rules that already exist';
                }
                else {
                    msg = 'You are trying to update a Rule that already exists';
                }
                heading = 'Edit Rule Status';

                this.toastr.error(msg, heading, {toastLife: 9000});
            } else {
                if (duplicates.length > 1) {
                    msg = 'You are trying to create Rules that already exist';
                }
                else {
                    msg = 'You are trying to create a Rule that already exists';
                }
                heading = 'Add Rule Status';
                this.toastr.error(msg, heading, {toastLife: 9000});
            }

        } else if (duplicates.length > 0 && ruleIds.length > 0) {
            {
                if (ruleIds.length > 0) {
                    let msg = '',
                        heading = '';

                    if ('edit' === this.state) {
                        if (ruleIds.length > 1) {
                            msg = 'Rules ' + ruleIds.join(", ") + ' has been updated successfully.';
                        }
                        else {
                            msg = 'Rule ' + ruleIds.join(", ") + ' has been updated successfully.';
                        }
                        heading = 'Edit Rule Status';
                        this.toastr.success(msg, heading, {toastLife: 9000});
                        this.router.navigate(['/']);
                    } else {
                        if (ruleIds.length > 1) {
                            msg = 'Rules ' + ruleIds.join(", ") + ' has been created successfully.';
                        }
                        else {
                            msg = 'Rule ' + ruleIds.join(", ") + ' has been created successfully.';
                        }
                        heading = 'Add Rule Status';
                        this.toastr.success(msg, heading, {toastLife: 9000});
                    }
                }
                if (duplicates.length > 0) {

                    let msg = '',
                        heading = '';

                    this.counter = this.groups;
                    this.setModelValues(duplicates);

                    if ('edit' === this.state) {
                        if (duplicates.length > 1) {
                            msg = 'You are trying to update Rules that already exist';
                        }
                        else {
                            msg = 'You are trying to update a Rule that already exists';
                        }
                        heading = 'Edit Rule Status';

                        this.toastr.error(msg, heading, {toastLife: 9000});
                    } else {
                        if (duplicates.length > 1) {
                            msg = 'You are trying to create Rules that already exist';
                        }
                        else {
                            msg = 'You are trying to create a Rule that already exists';
                        }
                        heading = 'Add Rule Status';
                        this.toastr.error(msg, heading, {toastLife: 9000});
                    }
                }
            }
        }
    }

	_markAsUntouched () {
		this.myForm.controls[this.groups[this.groups.length - 1].location].markAsUntouched();
		this.myForm.controls[this.groups[this.groups.length - 1].amt].markAsUntouched();
		this.myForm.controls[this.groups[this.groups.length - 1].dateRange].markAsUntouched();
	}

	setDropDownDefaults () {
		this.groups[this.groups.length - 1].countries = this.countries;
		this.rule[this.groups[this.groups.length - 1].location] = '';
		this.rule[this.groups[this.groups.length - 1].amt] = '';
        this.rule[this.groups[this.groups.length - 1].status] = true;
		this.rule[this.groups[this.groups.length - 1].dateRange] = '';
		this.rule[this.groups[this.groups.length - 1].issCountryShuffleBox] = this.groups[this.groups.length - 1].countries;
		this.rule[this.groups[this.groups.length - 1].dateRangeType] = 'days';
		this.rule[this.groups[this.groups.length - 1].amtType] = 'equals';
		this.rule[this.groups[this.groups.length - 1].issCountryOperator] = 'equals';
		this.rule[this.groups[this.groups.length - 1].isOpenShuffleBox] = 'false';
        this.rule[this.groups[this.groups.length - 1].invalidDateRange] = false;
		this.rule[this.groups[this.groups.length - 1].issCountryDropdown] = '';
	}

	mapToJson () {
		const allRules = [];

		var rule = {};

		this.groups.map(group => {
			const issCountryOperator = this.rule[group.issCountryOperator];
			let issCountryVal;

			if ('oneof' === issCountryOperator || 'other' === issCountryOperator) {
				issCountryVal = this.rule[group.issCountryShuffleInput] ? this.rule[group.issCountryShuffleInput] : 'all';
			} else {
				issCountryVal = this.rule[group.issCountryDropdown] ? this.rule[group.issCountryDropdown] : 'all';
			}
			rule = {
				ruleId: this.rule[group.ruleId] ? this.rule[group.ruleId] : '',

				localTxnAmountVal: this.rule[group.amt],
				localTxnAmountClause: this.rule[group.amtType],

				timeValue: this.rule[group.dateRange],
				timeUnit: this.rule[group.dateRangeType],

				locationIdValue: this.rule[group.location],
				locationIdClause: 'equals',

				issuerCntryValue: issCountryVal,
				issuerCntryClause: this.rule[group.issCountryOperator],

                activeSW: this.rule[group.status] == true ? "Y" : "N"
            };
			allRules.push(rule);
			return 1;
		});
		return allRules;
	}

	onCountryOperatorSelect (event, i) {
		this.rule[this.groups[i].issCountryOperator] = event.target.value;
		this.groups[i].countries = this.countries;
		this.groups[i].countries.map(country => {
			country.selected = false;
			return country;
		});
		this.rule[this.groups[i].issCountryShuffleBox] = this.groups[i].countries;
	}

    onDateRangeTypeSelect(event , i){
        const a =  event.target.value;
        this.validateDateRange(a ,i);
    }


    onDateRangeType(i){
        const a = this.rule[this.groups[i].dateRangeType];
        this.validateDateRange(a ,i);
    }

    validateDateRange(a , i)
    {
        const inputValue = Number(this.rule[this.groups[i].dateRange]);
        switch (a) {
        case "days":
            if(inputValue > this.MAX_DAYS )
            {
                this.rule[this.groups[i].invalidDateRange] = true;
                this.isSaving = true;
            }
            else
            {
                this.rule[this.groups[i].invalidDateRange] = false;
                this.isSaving = false;
            }
            break;
        case "weeks":
            if(inputValue > this.MAX_WEEKS)
            {
                this.rule[this.groups[i].invalidDateRange] = true;
                this.isSaving = true;
            }
            else
            {
                this.rule[this.groups[i].invalidDateRange] = false;
                this.isSaving = false;
            }
            break;
        case "months":
            if(inputValue > this.MAX_MONTHS)
            {
                this.rule[this.groups[i].invalidDateRange] = true;
                this.isSaving = true;
            }
            else
            {
                this.rule[this.groups[i].invalidDateRange] = false;
                this.isSaving = false;
            }
            break;
        default:
            this.rule[this.groups[i].invalidDateRange] = true;
    }

    }
    onReturn () {
		this.loc.back ();
	}

	setListValue (values, i) {
		if (values !== null) {
			this.rule[this.groups[i].issCountryShuffleInput] = values.filter (item => item.selected).map (item => item.id).join(',');
		}
	}

	openUpdateForm () {
		const rules = this.data.storage;

		this.counter = 0;
		this.groups = [];
		this.setModelValues (rules);
	}

	setModelValues (rules) {
		rules.forEach((rule, i) => {
			this.proceedToAddRule ();
			this.rule[this.groups[i].location] = rule.locationIdValue;
			this.rule[this.groups[i].amt] = rule.localTxnAmountVal;
			this.rule[this.groups[i].amtType] = rule.localTxnAmountClause;
			this.rule[this.groups[i].dateRange] = rule.timeValue;
			this.rule[this.groups[i].dateRangeType] = rule.timeUnit;
			this.rule[this.groups[i].issCountryOperator] = rule.issuerCntryClause;
			this.groups[i].countries = this.countries;
			if ('oneof' === rule.issuerCntryClause || 'other' === rule.issuerCntryClause) {
                this.rule[this.groups[i].issCountryShuffleInput] = rule.issuerCntryValue;
			} else {

				this.rule[this.groups[i].issCountryDropdown] = rule.issuerCntryValue;
			}

			if ('edit' === this.state) {
				this.rule[this.groups[i].ruleId] = rule.ruleId;
				this.rule[this.groups[i].status] = rule.activeSW === 'Y' ? true : false;
			}
		});
	}

	setShuffleBoxCountries (input, i) {
		let selectedCountries = input.split(",");
		let countries = [];

		countries = this.countries.map(country => {
			country.selected = selectedCountries.indexOf(country.id) > -1 ? true : false;
			return country;
		});
		this.rule[this.groups[i].issCountryShuffleBox] = countries;
	}
}
