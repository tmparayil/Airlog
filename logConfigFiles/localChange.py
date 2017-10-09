#################################################################
#								#
#	Python Script to change paths so that individual	#
#	developers can use for local development and tes	#
#	-ting.							#
#	Takes two parameters old guid and new guid		#
#	Will make as entire path replacement if necessit	#
#	-y comes.. Currently if just changed GUID thidgs	#
#	work.							#
#	20 Jan 2015 	Ranjith					#
#								#
#################################################################

import sys

file 	= open('app/routes/routes.js','r')
contents= file.readlines()

#Break if no propper arguments are there 
if len(sys.argv)<3 or len(sys.argv)>3 :
	print "Invalid Argument count"
	exit(1)

#Variables
oldName = sys.argv[1]
newName = sys.argv[2]
l 	= len(oldName)
file	= open('app/routes/routes.js','w')
count 	= 0

for line in contents:
	while line.find(oldName) >= 0 :
		x = line.find(oldName) 
		line = line[:x] + newName + line[x+l:]
		count+=1
	file.write(line)
print 'Made '+ str(count)+' changes..'
