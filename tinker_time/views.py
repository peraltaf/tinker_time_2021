from __future__ import unicode_literals
from django.shortcuts import get_object_or_404, render, redirect
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.views.generic import ListView, CreateView, DetailView, TemplateView
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
import bson
from bson import json_util
from bson.json_util import dumps,loads
from bson.son import SON
# from .jira_client import create_issue
# from .models import *

import gspread
import pandas as pd
from oauth2client.service_account import ServiceAccountCredentials


# scope = ['https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/drive']
# try:
#     creds = ServiceAccountCredentials.from_json_keyfile_name('/Users/fperalta/Dropbox/mt-data-products_rv-mt-data-prod.json', scope)
# except:
#     creds = ServiceAccountCredentials.from_json_keyfile_name('/usr/local/deploy/sales_hub/current/programmatic_spend/mt-data-products_rv-mt-data-prod.json', scope)
# client = gspread.authorize(creds)
# sheet = client.open('Sales Hub').get_worksheet(0)
# ctx = [{ 'title': r[0], 'desc': r[1], 'url': r[2], 'images': r[3], 'visibility': r[4] } for r in sheet.get_all_values()[1:]]


# def load_page(request):
#     template = 'file_upload.html'
#     ctx = {}
#     return render(template_name=template,
#                   request=request,
#                   context={'cms': ctx})




def file_upload(request):
    if request.method == 'GET':
        return render(request, 'file_upload.html')
    elif request.method == 'POST':
        insert_id = '{0}|{1}'.format(request.user.username,datetime.now().timestamp())
        threads = list()

        for file in request.FILES:
            x = threading.Thread(target=upload_thread, name=file,
                args=(request.FILES[file],file,month_id,year,quarter_id,insert_id,request.user.email))
            threads.append(x)
            x.start()

        return render(request, template,
            {
                'status': 'success',
                'message': 'Data for the month of {0} has been sent to the server for upload. You will receive an email with the results of the upload once completed.'.format(month_id),
            })


